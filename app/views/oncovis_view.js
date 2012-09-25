var View = require('./view');
var template = require('./templates/oncovis');
var Mutations = require('../models/mutations');

module.exports = View.extend({
    model: Mutations,
    template:template,
    label: "Oncovis",

    events: {
        "click .reset-sliders": "resetSliders"
    },

    initialize: function() {
        _.bindAll(this,'renderGraph','initControls','autocomplete','render','resetSliders');
    },

    getRenderData:function () {
    },

    afterRender:function () {
        var _this = this;
        this.$el.addClass('row');
        this.initControls();
        this.model.fetch().done(_this.renderGraph);
    },

    renderGraph:function () {
        console.log("renderGraph:start");

        var oncovisData = this.model.toJSON();

        var categories = _.uniq(_.compact(_.flatten(_.map(oncovisData.data, function(obj) {
            return _.map(obj, function(sub) {
                return sub["value"];
            });
        }))));

        var color_categories = {};
        _.each(colorbrewer.Set1[categories.length], function(color, idx) {
            color_categories[categories[idx]] = color;
        });

        var columns_by_cluster = {};
        _.each(oncovisData.columns_by_cluster, function(columns, cluster) {
            columns_by_cluster[cluster] = _.sortBy(columns, function(sample) {
                return _.map(oncovisData.row_labels, function(row_label) {
                    return oncovisData.data[sample][row_label]["value"];
                });
            });
        });

        var optns = {
            bar_width:4,
            column_spacing:1,
            plot_width:3000,
            label_width:70,
            highlight_fill: colorbrewer.RdYlGn[3][2],
            color_fn:function(d) {
                return (color_categories[d.value]) ? color_categories[d.value] : "lightgray";
            },
            columns_by_cluster:columns_by_cluster,
            cluster_labels:oncovisData.cluster_labels,
            row_labels:oncovisData.row_labels
        };

        _.extend(optns, { "bar_height": this.$el.find(".slider_barheight").oncovis_range_value() });
        _.extend(optns, { "row_spacing": this.$el.find(".slider_rowspacing").oncovis_range_value() });
        _.extend(optns, { "bar_width": this.$el.find(".slider_barwidth").oncovis_range_value() });
        _.extend(optns, { "column_spacing": this.$el.find(".slider_barspacing").oncovis_range_value() });
        _.extend(optns, { "cluster_spacing": this.$el.find(".slider_clusterspacing").oncovis_range_value() });
        _.extend(optns, { "label_fontsize": this.$el.find(".slider_fontsize").oncovis_range_value() });
        
        this.$el.find(".oncovis-container").oncovis(oncovisData.data, optns);

        console.log("renderGraph:end");
    },

    initControls: function() {
        console.log("initControls:start");
        var me = this;
        var visrangeFn = function(property) {
            return function(value) {
                var dim = {};
                dim[property] = value;
                me.$el.find(".oncovis-container").update(dim);
            }
        };

        this.$el.find(".slider_barheight").oncovis_range({ storageId: "slider_barheight", min: 10, max: 50, initialStep: 20, slide: visrangeFn("bar_height") });
        this.$el.find(".slider_rowspacing").oncovis_range({ storageId: "slider_rowspacing", min: 0, max: 50, initialStep: 10, slide: visrangeFn("row_spacing") });
        this.$el.find(".slider_barwidth").oncovis_range({ storageId: "slider_barwidth", min: 1, max: 10, initialStep: 5, slide: visrangeFn("bar_width") });
        this.$el.find(".slider_barspacing").oncovis_range({ storageId: "slider_barspacing", min: 0, max: 10, initialStep: 2, slide: visrangeFn("column_spacing") });
        this.$el.find(".slider_clusterspacing").oncovis_range({ storageId: "slider_clusterspacing", min: 0, max: 50, initialStep: 10, slide: visrangeFn("cluster_spacing") });
        this.$el.find(".slider_fontsize").oncovis_range({ storageId: "slider_fontsize", min: 5, max: 21, initialStep: 14, slide: visrangeFn("label_fontsize") });

        console.log("initControls:end");
    },

    autocomplete: function(query, resultBin) {
        var found = [];

        var queryterms = query.toLowerCase().split(" ");
        _.each(queryterms, function(queryterm) {
            _.each(oncovisData.data, function(val, key) {
                if (key.toLowerCase().indexOf(queryterm) >= 0) {
                    found.push("<a href='#oncovis/p:" + key + "'>Patient ID " + key + "</a>");
                }
            });
        });
        resultBin(found);
    },

    resetSliders: function() {
        this.$el.find(".slider_barheight").oncovis_range_reset();
        this.$el.find(".slider_rowspacing").oncovis_range_reset();
        this.$el.find(".slider_barwidth").oncovis_range_reset();
        this.$el.find(".slider_barspacing").oncovis_range_reset();
        this.$el.find(".slider_clusterspacing").oncovis_range_reset();
        this.$el.find(".slider_fontsize").oncovis_range_reset();
    }
});
