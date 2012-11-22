var PerCancer = Backbone.Model.extend({
    url:function () {
        return "svc/" + this.get("data_uri");
    },

    parse: function(data) {
        var allFeaturesById = _.groupBy(this.get("featureList"), "id");
        _.each(data.edges, function(edge) {
            edge.node1 = _.extend(edge.node1, allFeaturesById[edge.node1.id]);
            edge.node2 = _.extend(edge.node2, allFeaturesById[edge.node2.id]);
        });

        return { "data": data };
    },

    fetch:function (options) {
        return Backbone.Model.prototype.fetch.call(this, options);
    }
});

module.exports = Backbone.Model.extend({

    initialize: function (options) {
        _.extend(this, options);
    },

    url: function () {
        return this.get("data_uri");
    },

    parse: function(data) {
        var gene1 = this.get("genes")[0];
        var gene2 = this.get("genes")[1];

        var nodesByCancer = _.groupBy(data.items, "cancer");
        var featuresByCancer = {};
        _.each(nodesByCancer, function(nodes, cancer) {
            var features_1 = [];
            var features_2 = [];
            _.each(nodes, function(node) {
                if (_.isEqual(node.gene, gene1.toLowerCase())) {
                    features_1.push(node.id);
                } else if (_.isEqual(node.gene, gene2.toLowerCase())) {
                    features_2.push(node.id);
                }
            });
            featuresByCancer[cancer] = {};
            featuresByCancer[cancer]["features_1"] = features_1;
            featuresByCancer[cancer]["features_2"] = features_2;
        });

        return { "featureListsByCancer": featuresByCancer, "nodesByCancer": nodesByCancer };
    },

    fetch: function (options) {
        var origSuccessFn = options.success || function() {};
        var _this = this;
        return Backbone.Model.prototype.fetch.call(this, _.extend(options, {
            success: function() {
                _this.fetch_associations(origSuccessFn);
            }
        }));
    },

    fetch_associations: function(successFn) {
        var associationsUri = this.get("catalog_unit").associations;
        if (_.isEmpty(associationsUri)) {
            successFn();
            return;
        }

        var featureListsByCancer = this.get("featureListsByCancer");
        var singleSuccessFn = _.after(_.keys(featureListsByCancer).length, successFn);

        var perCancers = _.map(featureListsByCancer, function(featureList, cancer) {
            console.log("perCancer=" + cancer);
            var perCancer = new PerCancer({
                "data_uri": associationsUri,
                "cancer": cancer,
                "featureList": featureList
            });
            perCancer.fetch({
                "data": {
                    "feature1": featureList.features_1,
                    "feature2": featureList.features_2,
                    "cancer": cancer
                },
                "traditional": true,
                "success": singleSuccessFn,
                "error": singleSuccessFn
            });
            return perCancer;
        });

        this.set("associationsByCancer", perCancers);
        this.set("nodesByCancer", this.get("nodesByCancer"));
    }
});
