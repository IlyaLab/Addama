var View = require('./view');
var template = require('./templates/xfeaturegrid');

module.exports = View.extend({
    template:template,
    className:"row-fluid",
    geneA:"UGCG",
    geneB:"TP53",
    cancer_type:"BRCA",

    events:{
        "click .cancer-selector a":function (e) {
            console.log("cancer-selector=" + $(e.target).data("id"));
            this.cancer_type = $.data(e.target).id;
            this.loadFeatureMatrixData();
        },
        "click .gene-a-selector a":function (e) {
            console.log("gene-a-selector=" + $(e.target).data("id"));
            this.geneA = $.data(e.target).id;
            this.loadFeatureMatrixData();
        },
        "click .gene-b-selector a":function (e) {
            console.log("gene-b-selector=" + $(e.target).data("id"));
            this.geneB = $.data(e.target).id;
            this.loadFeatureMatrixData();
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

        this.loadData = _.after(2, this.loadData);

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

    buildGridLabel: function(feature) {
        if (feature.source === 'METH') {
            return "METH:" + feature.modifier;
        }
        else {
            return feature.source;
        }
    },

    loadData: function() {
        this.loadFeatureMatrixData();
    },

    loadFeatureMatrixData: function() {
        var uri = this.model.data_uri + "?gene1=" + this.geneA + "&gene2=" + this.geneB + "&cancer=" + this.cancer_type.toLowerCase();

        $.ajax({
            url: uri,
            type: "GET",
            dataType: "text",
            context: this,
            success: function(response) {
                var json = $.parseJSON(response);
                this.parseData(json);
            }
        });
    },

    parseData: function(param_data) {
        var pairwise_map = _.reduce(param_data.pairwise_results, function(memo, result) {
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

        this.data = {
            features: param_data.features,
            pwpv: pairwise_map
        };

        this.updateGrid();
    },

    updateGrid: function() {
        var that = this;

        var pwpv = this.data.pwpv;

        var get_pairwise_data = function(id1, id2) {
            if (_.has(pwpv, id1)) {
                return pwpv[id1][id2];
            }
            else if (_.has(pwpv, id2)) {
                return pwpv[id2][id1];
            }

            return undefined;
        };

        var negative_color_scale = d3.scale.linear().domain([-32.0, 0.0]).range(["blue", "white"]);
        var positive_color_scale = d3.scale.linear().domain([0.0, 32.0]).range(["white", "red"]);

        var get_css_color = function(id1, id2) {
            var pw = get_pairwise_data(id1, id2);

            if (pw === undefined) {
                return "gray";
            }

            if (pw.corr < 0) {
                return negative_color_scale(-pw.mlog10p);
            }
            else {
                return positive_color_scale(pw.mlog10p);
            }
        };

        var gene_a_model_features = this.data.features[this.geneA];
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
            .chain(this.data.features[this.geneB])
            .map(function(feature) {
                return {
                    d: feature,
                    grid_label: that.buildGridLabel(feature),
                    row:_.map(gene_a_features, function(af) {
                        return {
                            d: af.d,
                            color: get_css_color(feature.id, af.d.id)
                        };
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