var PerCancer = Backbone.Model.extend({
    url:function () {
        return "svc/" + this.get("data_uri");
    },

    parse: function(data) {
        var allFeaturesById = _.groupBy(this.get("nodes"), "id");
        _.each(data.edges, function(edge) {
            edge.node1 = _.extend(edge.node1, allFeaturesById[edge.node1.id][0]);
            edge.node2 = _.extend(edge.node2, allFeaturesById[edge.node2.id][0]);
        });
        return { "data": data };
    },

    fetch:function (options) {
        return Backbone.Model.prototype.fetch.call(this, options);
    },

    getAssociation: function(f1, f2) {
        var edges = this.get("data").edges;
        return _.find(edges, function(edge) {
            var e1 = edge.node1.id;
            var e2 = edge.node2.id;
            return (_.isEqual(e1, f1) || _.isEqual(e1, f2)) && (_.isEqual(e2, f1) || _.isEqual(e2, f2));
        });
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

        var results = { "featureListsByCancer": featuresByCancer, "nodesByCancer": nodesByCancer };

        this.set("items", data.items);
        if (_.isEmpty(data.items)) {
            return _.extend(results, { "ROWS": [], "COLUMNS": [], "DATA": [] });
        }

        var ROWS = _.pluck(data.items, "id");
        var COLUMNS = _.keys(data.items[0].values);
        var coldict = {};
        _.each(COLUMNS, function(col, idx) {
            return coldict[col] = idx;
        });

        var row_array;
        var DATA = _.map(data.items, function (data_item) {
            row_array = [];
            _.each(data_item.values, function(value_obj, value_key) {
                row_array[coldict[value_key]] = value_obj;
            });
            return row_array;
        });
        return _.extend(results, { "ROWS": ROWS, "COLUMNS": COLUMNS, "DATA": DATA });
    },

    fetch: function (options) {
        var origSuccessFn = options.success || function() {
        };
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

        var perCancers = {};
        _.each(featureListsByCancer, function(featureList, cancer) {
            var perCancer = new PerCancer({
                "data_uri": associationsUri,
                "nodes": this.get("nodesByCancer")[cancer]
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
            perCancers[cancer] = perCancer;
        }, this);

        this.set("associationsByCancer", perCancers);
//        this.set("nodesByCancer", this.get("nodesByCancer"));
    }
});
