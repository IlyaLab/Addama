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
        var associationsByCancer = this.model.get("associationsByCancer");

        var featureLabel = function(feature) {
            return feature.source + "::" + feature.modifier;
        };
        
        var cancerData = _.map(this.model.get("nodesByCancer"), function(perCancerData, cancer) {
            var featuresByGene = _.groupBy(perCancerData, "gene");
            var aByC = associationsByCancer[cancer];

            var get_css_color = function(id1, id2) {
                var assoc = aByC.getAssociation(id1, id2);
                if (!assoc) return "grey";
                if (assoc.rho < 0) return negative_color_scale(-assoc.pvalue);
                return positive_color_scale(assoc.pvalue);
            };

            var gene_a_features = _.map(featuresByGene[geneA] || featuresByGene[geneA.toLowerCase()], function(feature) {
                return { "d": feature, "grid_label": featureLabel(feature) };
            });

            var gene_b_features = _.map(featuresByGene[geneB] || featuresByGene[geneB.toLowerCase()], function(feature) {
                return {
                    "d": feature,
                    "grid_label": featureLabel(feature),
                    "row":_.map(gene_a_features, function(af) {
                        return _.extend(af, { "color": get_css_color(feature.id, af.d.id) });
                    })
                };
            });

            return { "label": cancer, "geneA": geneA, "geneB": geneB, "headers": gene_a_features, "data": gene_b_features };
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
        this.trigger("selected", this.model.get("nodesByCancer")[grouping][featureId]);
    }
});