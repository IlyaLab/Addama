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
        var str = "GEXP:TP43:y_n_somatic";
        return _.any(this.features_of_interest, function (foi) {
            var queryPattern = foi.regexp.replace(/\*/g, ".*?");
            var queryRegex = new RegExp(queryPattern, 'gi');
            return queryRegex.test(feature_id);
        });
    },

    loadData:function () {
        var gene_a = this.geneA;
        var gene_b = this.geneB;
        var cancer = this.cancer;

        var _this = this;
        var rows = this.model.get("ROWS");
        var genea_rows = _.map(rows, function (row) {
            return row.indexOf(gene_a) >= 0 && _this.isFeatureOfInterest(row);
        });
        var geneb_rows = _.compact(_.map(rows, function (row, rowIdx) {
            if (row.indexOf(gene_b) >= 0) {
                var featureOfInterest = _this.getFeatureOfInterest(row);
                if (!_.isEmpty(featureOfInterest)) {
                    return { "rowIdx": rowIdx, "row": row, "foi": featureOfInterest };
                }
            }
            return null;
        }));

        // TODO : lookup values for gene associations in pairwise analysis
        var targetFeatures = _.map(this.features_of_interest, function (foi) {
            return { "label":foi.label, "featureValues":[
                {"value":"BLUE"},
                {"value":"GREEN"},
                {"value":"YELLOW"}
            ]};
        });

        var fn = function (ci) {
            return {"id":ci};
        };
        var genelist = _.isEmpty(this.geneList) ? [this.geneA, this.geneB] : this.geneList;
        this.$el.html(this.template({
            "targetFeatures":targetFeatures,
            "geneList":_.map(genelist, fn),
            "cancerList":_.map(this.cancerList, fn)
        }));
    }
});