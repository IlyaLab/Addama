var PerCancer = Backbone.Model.extend({
    url:function () {
        return this.get("data_uri") + "?gene1=" + this.get("gene1") + "&gene2=" + this.get("gene2") + "&cancer=" + this.get("cancer");
    },

    parse: function(data) {
        if (_.isEmpty(data.pairwise_results)) {
            return { "features": data.features, "pwpv": [] }
        }
        
        var pairwise_map = _.reduce(data.pairwise_results, function(memo, result) {
            var id1 = result.predictor;
            var id2 = result.target;

            if (!_.has(memo, id1)) {
                memo[id1] = {};
            }

            memo[id1][id2] = {
                corr: result.values[0],
                nonNAs: result.values[1],
                mlog10p: result.values[2],
                corrected_mlog10p: result.values[4]
            };

            return memo;
        }, {});

        return {
            "features": data.features,
            "pwpv": pairwise_map
        };
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
        return "svc" + this.data_uri;
    },

    fetch: function (options) {
        _.extend(this, options);

        // TODO :: Fetch all gene combinations a priori?
        var gene1 = this.genes[0];
        var gene2 = this.genes[1];
        var data_uri = this.data_uri;
        var perCancers = _.map(this.cancers, function(cancer) {
            return new PerCancer(_.extend(options, { "data_uri": data_uri, "gene1": gene1, "gene2": gene2, "cancer": cancer }));
        });

        this.set("data", perCancers);

        var successFn = _.after(perCancers.length, options.success || function(){});
        _.each(perCancers, function(perCancer) {
            perCancer.fetch({ "success": successFn, "error": successFn });
        });
    },

    allFeatures: function() {
        if (!this.get("allFeatures")) {
            var allFeatures = {};
            _.each(this.cancers, function(cancer) {
                allFeatures[cancer] = {};
            });

            _.each(this.get("data"), function(perCancer) {
                var featuresByGene = perCancer.get("features");
                var cancer = perCancer.get("cancer");
                _.each(featuresByGene, function(fByGene) {
                    _.each(fByGene, function(feature) {
                        if (allFeatures[cancer][feature.id]) {
                            console.log("duplicate!" + feature.id);
                        }
                        allFeatures[cancer][feature.id] = feature;
                    });
                });
            });

            this.set("allFeatures", allFeatures);
        }

        return this.get("allFeatures");
    }
});
