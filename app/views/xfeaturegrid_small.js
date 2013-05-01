var Template = require('./templates/xfeaturegrid_small');

module.exports = Backbone.View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "loadData");

        this.model.on("load", this.loadData);
    },

    loadData: function() {
        var geneA = this.genes[0];
        var geneB = this.genes[1];
        
        var negative_color_scale = d3.scale.linear().domain([-16.0, 0.0]).range(["blue", "white"]);
        var positive_color_scale = d3.scale.linear().domain([0.0, 16.0]).range(["white", "red"]);
        var associationsByCancer = this.model.get("associationsByCancer");

        var cancerData = _.map(this.model.get("nodesByCancer"), function(perCancerData, cancer) {
            var featuresByGene = _.groupBy(perCancerData, "gene");
            var aByC = associationsByCancer[cancer];

            var get_css_color = function(f1, f2) {
                var assoc = aByC.getAssociation(f1, f2);
                if (!assoc) return "grey";
                if (assoc.rho < 0) return negative_color_scale(-assoc.pvalue);
                return positive_color_scale(assoc.pvalue);
            };

            var gene_a_features = _.map(featuresByGene[geneA] || featuresByGene[geneA.toLowerCase()], function(feature) {
                return { "d": feature };
            });

            var gene_b_features = _.map(featuresByGene[geneB] || featuresByGene[geneB.toLowerCase()], function(feature) {
                return {
                    "d": feature,
                    "row":_.map(gene_a_features, function(af) {
                        return _.extend(af, { "color": get_css_color(feature.id, af.d.id) });
                    })
                };
            });

            return { "label": cancer, "data": gene_b_features };
        });

        this.$el.html(Template({ "data": cancerData }));
    }
});