var View = require('./view');
var template = require('./templates/xfeaturegrid_small');

module.exports = View.extend({
    template:template,
    className:"row-fluid",

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "afterRender", "loadData");
        _.bindAll(this, "parseFeaturesOfInterest", "isFeatureOfInterest");

        this.loadData = _.after(2, this.loadData);

        this.model.on("load", this.loadData);

        $.ajax({ url:"svc/data/lookups/features_of_interest", type:"GET", dataType:"text", success:this.parseFeaturesOfInterest, error:this.loadData });
    },

    getRenderData:function () {
        return {"targetFeatures":[]}
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

    getFeatureOfInterest: function(feature_id) {
        return _.first(_.map(this.features_of_interest, function (foi) {
            var queryPattern = foi.regexp.replace(/\*/g, ".*?");
            var queryRegex = new RegExp(queryPattern, 'gi');
            if (queryRegex.test(feature_id)) {
                return foi;
            }
        }));
    },

    loadData:function () {
        var gene_a = this.genes[0];
        var gene_b = this.genes[1];

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

        // TODO : color by gene associations in pairwise analysis
        var cancerItems = _.map(this.cancers, function(cancer) {
            var targetFeatures = _.map(_this.features_of_interest, function (foi) {
                return { "label":foi.label, "featureValues":[
                    {"value":"blue"},
                    {"value":"green"},
                    {"value":"yellow"}
                ]};
            });
            return { "id": cancer, "targetFeatures": targetFeatures};
        });

        this.$el.html(this.template({ "cancers": cancerItems }));
    }
});