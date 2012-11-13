var View = require('./view');
var template = require('./templates/scatterplot');

module.exports = View.extend({
    template: template,
    label: "Scatterplot",
    className: "row-fluid",

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, 'afterRender', 'initControls', 'initFeatureSourcesSelect', 'initGeneTypeaheads', 'initGraph', 'initSubtypeDropdown', 'updateSubtype', 'updateGraph', 'parseFeatureData', 'buildFeatureQuery', 'loadFeatureData');

        
        $.ajax({
            url:"svc/data/lookups/genes",
            type:"GET",
            dataType:"text",
            success:this.initGeneTypeaheads
        });

        $.ajax({
            url:"svc/data/lookups/cancers",
            type:"GET",
            dataType:"text",
            success:this.initSubtypeDropdown
        });

        $.ajax({
            url:"svc/data/lookups/features_of_interest",
            type:"GET",
            dataType:"text",
            success:this.initFeatureSourcesSelect
        });

        this.drawGraph = _.once(this.initGraph);
    },

    afterRender: function () {
        this.initControls();
    },

    initControls: function () {
        var cancer = "brca";
        var id1 = "N:CNVR:10p15.1:chr10:5921000:6393999::";
        var id2 = "N:GNAB:TP53:chr17:7565097:7590863:-:binding_delta_abs_somatic";

        this.loadFeatureData('fmx_newMerge_05nov', id1, id2, cancer);
    },

    initSubtypeDropdown: function(txt) {
        var that = this;
        var cancerlist = txt.trim().split("\n");

        _.each(cancerlist, function(subtype) {
            var html = '<option>' + subtype + '</option>';
            that.$el.find(".subtype-select").append(html);
        });

        this.$el.find(".subtype-select").change(function(e) {
            var subtype = that.$el.find(".subtype-select").val()
            that.updateSubtype(subtype);
        });
    },

    initFeatureSourcesSelect: function(txt) {
        var that = this;
        var sources = _
            .chain(txt.split(/\s+/))
            .filter(function(label) {
                return !label.length == 0;
            })
            .reduce(function(memo, label) {
                if (!_.has(memo, label)) {
                    memo[label] = 1;
                }

                return memo;
            }, {})
            .keys()
            .value();
        
        _.each(sources, function(s) {
            var html = '<option>' + s + '</option>';
            that.$el.find(".featuresource-select").append(html);
        });

        this.$el.find(".featuresource-select").change(function(e) {
            var subtype = that.$el.find(".subtype-select").val()
            that.updateSubtype(subtype);
        });
    },

    initGeneTypeaheads: function(txt) {
        var that = this;
        this.genelist = txt.trim().split("\n");

        var source_fn = function (q, p) {
            p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function (qi) {
                return _.map(that.genelist, function (geneitem) {
                    if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                });
            }))));
        };

        this.$el.find(".genes-typeahead").typeahead({
            source: source_fn
        });
    },

    initGraph: function () {
        var plot_data = {
            DATATYPE : "vq.models.ScatterPlotData",
            CONTENTS : {
                PLOT : {
                    width : 768, height: 768,
                    dblclick_notifier : function() {},
                    vertical_padding : 80,
                    horizontal_padding: 80,
                    x_label_displacement: 40,
                    y_label_displacement: -70,
                    x_tick_displacement: 20,
                    enable_transitions: true
                },
                axis_font :"20px helvetica",
                tick_font :"20px helvetica",
                stroke_width: 2,
                radius: 6,
                data_array: this.data.values,
                regression: 'none',
                xcolumnid: 'x',
                ycolumnid: 'y',
                valuecolumnid: 'id'
            }
        };

        this.$el.find(".scatterplot-container").scatterplot(plot_data);
        this.trigger("post-render");
    },

    updateGraph: function() {
        this.drawGraph();
    },

    updateSubtype: function(subtype) {
        console.log(subtype);

    },


    // Functions for loading parsing the feature values
    // ------------------------------------------------
    parseFeatureData: function(feature_data) {
        var that = this;
        this.data = {
            values: []
        };

        _.each(feature_data.f1.values, function(v1, key) {
            var v2 = feature_data.f2.values[key];

            if (v1 != 'NA' && v2 != 'NA')
            that.data.values.push({
                x: v1,
                y: v2,
                id: key
            });
        });

        console.log(this.data);
        this.updateGraph();
    },

    buildFeatureQuery: function(collection, subtype, feature_id) {
        var feature_query = "?cancer=" + subtype + "&id=" + feature_id;
        return "/svc/lookups/qed_lookups/" + collection + "/" + feature_query;
    },

    loadFeatureData: function(collection, feature_1, feature_2, cancer_subtype) {
        var that = this,
            data = {},
            query_1 = this.buildFeatureQuery(collection, cancer_subtype, feature_1),
            query_2 = this.buildFeatureQuery(collection, cancer_subtype, feature_2);

        var successFn = _.after(2, function() {
            that.parseFeatureData(data);
        });

        $.ajax({
            type: 'GET',
            url: query_1,
            context: this,
            success: function(json) {
                data.f1 = json.items[0];
                successFn();
            }
        });

        $.ajax({
            type: 'GET',
            url: query_2,
            context: this,
            success: function(json) {
                data.f2 = json.items[0];
                successFn();
            }
        });
    }
});
