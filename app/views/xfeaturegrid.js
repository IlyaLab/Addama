var View = require('./view');
var template = require('./templates/xfeaturegrid');

module.exports = View.extend({
    template:template,
    className:"row-fluid",
    geneA:"TP53",
    geneB:"CTCF",

    events:{
        "click .cancer-selector a":function (e) {
            console.log("cancer-selector=" + $(e.target).data("id"));
        },
        "click .gene-a-selector a":function (e) {
            console.log("gene-a-selector=" + $(e.target).data("id"));
        },
        "click .gene-b-selector a":function (e) {
            console.log("gene-b-selector=" + $(e.target).data("id"));
        },
        "click .color-by-selector a":function (e) {
            console.log("color-by-selector=" + $(e.target).data("id"));
        }
    },

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "afterRender", "loadData");
        _.bindAll(this, "parseFeaturesOfInterest", "isFeatureOfInterest");
        _.bindAll(this, "parseCancerList");

        this.loadData = _.after(3, this.loadData);

        this.model.on("load", this.loadData);

        $.ajax({ url:"svc/data/lookups/features_of_interest", type:"GET", dataType:"text", success:this.parseFeaturesOfInterest, error:this.loadData });
        $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.parseCancerList, error:this.loadData });
    },

    getRenderData:function () {
        return {"targetFeatures":[]}
    },

    parseCancerList:function (txt) {
        this.cancerList = txt.trim().split("\n");
        this.loadData();
    },

    parseFeaturesOfInterest:function (txt) {
        var items = txt.trim().split("\n");
        this.features_of_interest = _.map(items, function (line) {
            var split = line.split("\t");
            return { "label":split[0], "regexp":split[1]};
        });
        this.loadData();
    },

    isFeatureOfInterest:function (feature_id) {
        return _.any(this.features_of_interest, function (foi) {
            var queryPattern = foi.regexp.replace(/\*/g, ".*?");
            var queryRegex = new RegExp(queryPattern, 'gi');
            return queryRegex.test(feature_id);
        });
    },

    getFeatureOfInterest: function(feature_id) {
        return _.first(_.map(this.features_of_interest, function (foi) {
            var queryPattern = foi.regexp.replace(/\*/g, ".*?");
            var queryRegex = new RegExp(queryPattern, 'gi');
            if (queryRegex.test(feature_id)) {
                return foi;
            }
        }));
    },

    loadData: function() {
        if (this.model.get("features") === undefined) {
            return;
        }
        
        this.updateGrid();
    },

    buildGridLabel: function(feature) {
        if (feature.source === 'METH') {
            return "METH:" + feature.modifier;
        }
        else {
            return feature.source;
        }
    },

    updateGrid: function() {
        var that = this;

        var gene_a = this.genes[0];
        var gene_b = this.genes[1];

        var pwpv = this.model.get("pwpv");
        var get_pairwise_data = function(id1, id2) {
            if (_.has(pwpv, id1)) {
                return pwpv[id1][id2];
            }
            else if (_.has(pwpv, id2)) {
                return pwpv[id2][id1];
            }

            return undefined;
        };

        var negative_color = d3.scale.linear().domain([-32.0, 0.0]).range(["blue", "white"]);
        var positive_color = d3.scale.linear().domain([0.0, 32.0]).range(["white", "red"]);

        var color_fn = function(id1, id2) {
            var pw = get_pairwise_data(id1, id2);

            if (pw === undefined) {
                return "gray";
            }

            if (pw.corr < 0) {
                return negative_color(-pw.mlog10p);
            }
            else {
                return positive_color(pw.mlog10p);
            }
        };

        var gene_a_model_features = this.model.get("features")[gene_a];
        var gene_a_features = _
            .chain(gene_a_model_features)
            .map(function(feature) {
                return {
                    d: feature,
                    grid_label: that.buildGridLabel(feature)

                };
            })
            .value();

        var gene_b_features = _
            .chain(this.model.get("features")[gene_b])
            .map(function(feature) {
                return {
                    d: feature,
                    grid_label: that.buildGridLabel(feature),
                    row:_.map(gene_a_features, function(af) {
                        return _.extend(af, {
                            color: color_fn(feature.id, af.d.id)
                        });
                    })
                };
            })
            .value();

        var fn = function (ci) {
            return {"id":ci};
        };
        var genelist = _.isEmpty(this.genes) ? [this.geneA, this.geneB] : this.genes;
        this.$el.html(this.template({
            "gene_a_features": gene_a_features,
            "gene_b_features": gene_b_features,
            "geneList":_.map(genelist, fn),
            "cancerList":_.map(that.cancers, fn)
        }));
    }
});