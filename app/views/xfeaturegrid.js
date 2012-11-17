var Template = require('./templates/xfeaturegrid');

module.exports = Backbone.View.extend({
    events:{
        "click .gene-a-selector a":function (e) {
            this.geneA = $(e.target).data("id");
            this.loadData();
        },
        "click .gene-b-selector a":function (e) {
            this.geneB = $(e.target).data("id");
            this.loadData();
        },
        "click .color-by-selector a":function (e) {
            console.log("color-by-selector=" + $(e.target).data("id"));
        }
    },

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "loadData", "handleGridClicks");

        this.model.on("load", this.loadData);
    },

    loadData: function() {
        var geneA = this.geneA || this.genes[0];
        var geneB = this.geneB || this.genes[1];

        var negative_color_scale = d3.scale.linear().domain([-16.0, 0.0]).range(["blue", "white"]);
        var positive_color_scale = d3.scale.linear().domain([0.0, 16.0]).range(["white", "red"]);
        var buildGridLabel = function(feature) {
            if (feature.source === 'METH') return "METH:" + feature.modifier;
            return feature.source;
        };

        var cancerData = _.map(this.model.get("data"), function(perCancerData) {
            var features = perCancerData.get("features");
            var pwpv = perCancerData.get("pwpv");
            var get_pairwise_data = function(id1, id2) {
                if (_.has(pwpv, id1)) return pwpv[id1][id2];
                if (_.has(pwpv, id2)) return pwpv[id2][id1];
                return null;
            };
            var get_css_color = function(id1, id2) {
                var pw = get_pairwise_data(id1, id2);
                if (!pw) return "lightgray";
                if (pw.corr < 0) return negative_color_scale(-pw.mlog10p);
                return positive_color_scale(pw.mlog10p);
            };

            var gene_a_features = _.map(features[geneA], function(feature) {
                return { "d": feature, "grid_label": buildGridLabel(feature) };
            });

            var gene_b_features = _.map(features[geneB], function(feature) {
                return {
                    "d": feature,
                    "grid_label": buildGridLabel(feature),
                    "row":_.map(gene_a_features, function(af) {
                        return _.extend(af, { "color": get_css_color(feature.id, af.d.id) });
                    })
                };
            });

            return { "label": perCancerData.get("cancer"), "headers": gene_a_features, "data": gene_b_features };
        });

        var fn = function (ci) {
            return {"id":ci};
        };

        _.first(cancerData)["isFirst"] = true;
        this.$el.html(Template({
            "data": cancerData,
            "geneList": _.map(this.genes, fn),
            "cancerList": _.map(this.cancers, fn)
        }));

        this.$el.find(".grid-label").click(this.handleGridClicks);
    },

    handleGridClicks: function(e) {
        var featureId = $(e.target).data("id");
        var grouping = $(e.target).data("grouping");
        var allFeatures = this.model.allFeatures();
        var selectedFeature = allFeatures[grouping][featureId];
        this.trigger("selected", selectedFeature);
    }
});