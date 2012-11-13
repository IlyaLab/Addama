var View = require('./view');
var template = require('./templates/scatterplot');

module.exports = View.extend({
    template: template,
    label: "Scatterplot",
    className: "row-fluid",

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, 'afterRender', 'initControls', 'initGraph', 'updateGraph', 'parseFeatureData', 'buildFeatureQuery', 'loadFeatureData');

        $.ajax({
            url:"svc/data/lookups/genes",
            type:"GET",
            dataType:"text",
            success:this.initTypeahead
        });

        $.ajax({
            url:"svc/data/lookups/cancers",
            type:"GET",
            dataType:"text",
            success:this.initSubtypeLists
        });

        $.ajax({
            url:"svc/data/lookups/features_of_interest",
            type:"GET",
            dataType:"text",
            success:this.initSubtypeLists
        });

        this.drawGraph = _.once(this.initGraph);
    },

    afterRender: function () {
        this.initControls();
    },

    initControls: function () {
        console.log("Scatterplot init");

        var cancer = "brca";
        var id1 = "N:CNVR:10p15.1:chr10:5921000:6393999::";
        var id2 = "N:GNAB:TP53:chr17:7565097:7590863:-:binding_delta_abs_somatic";

        this.loadFeatureData('fmx_newMerge_05nov', id1, id2, cancer);
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
