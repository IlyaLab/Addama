var View = require('./view');
var template = require('./templates/oncovis_controls');

module.exports = View.extend({
    template:template,

    events:{
        "click .reset-sliders": function() {
            this.$el.find(".slider_barheight").oncovis_range("reset");
            this.$el.find(".slider_rowspacing").oncovis_range("reset");
            this.$el.find(".slider_barwidth").oncovis_range("reset");
            this.$el.find(".slider_barspacing").oncovis_range("reset");
            this.$el.find(".slider_clusterspacing").oncovis_range("reset");
            this.$el.find(".slider_fontsize").oncovis_range("reset");
            this.$el.find(".slider_label_width").oncovis_range("reset");
        }
    },

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, 'initialValue');
    },

    afterRender: function() {
        this.$el.find(".slider_barheight").oncovis_range({ storageId:"slider_barheight", min:10, max:50, initialStep:20 });
        this.$el.find(".slider_rowspacing").oncovis_range({ storageId:"slider_rowspacing", min:10, max:50, initialStep:10 });
        this.$el.find(".slider_barwidth").oncovis_range({ storageId:"slider_barwidth", min:1, max:10, initialStep:3 });
        this.$el.find(".slider_barspacing").oncovis_range({ storageId:"slider_barspacing", min:0, max:10, initialStep:1 });
        this.$el.find(".slider_clusterspacing").oncovis_range({ storageId:"slider_clusterspacing", min:0, max:50, initialStep:10 });
        this.$el.find(".slider_fontsize").oncovis_range({ storageId:"slider_fontsize", min:5, max:21, initialStep:10 });
        this.$el.find(".slider_label_width").oncovis_range({ storageId:"slider_label_width", min:20, max:200, initialStep:100 });

        var _this = this;

        this.$el.find(".slider_barheight").bind("slide-to", function(e, value) {
            _this.trigger("updated", { "bar_height": value });
        });
        this.$el.find(".slider_rowspacing").bind("slide-to", function(e, value) {
            _this.trigger("updated", { "row_spacing": value });
        });
        this.$el.find(".slider_barwidth").bind("slide-to", function(e, value) {
            _this.trigger("updated", { "bar_width": value });
        });
        this.$el.find(".slider_barspacing").bind("slide-to", function(e, value) {
            _this.trigger("updated", { "column_spacing": value });
        });
        this.$el.find(".slider_clusterspacing").bind("slide-to", function(e, value) {
            _this.trigger("updated", { "cluster_spacing": value });
        });
        this.$el.find(".slider_fontsize").bind("slide-to", function(e, value) {
            _this.trigger("updated", { "label_fontsize": value });
        });
        var lastLabelWidth = 100;
        this.$el.find(".slider_label_width").bind("slide-to", function(e, value) {
            _this.trigger("updated", { "label_width": value });
            lastLabelWidth = value;
        });

        this.$el.find(".show-labels").click(function (e) {
            var btn = $(e.target)
            if (_.isEqual("Show Row Labels", btn.html())) {
                btn.html("Hide Row Labels");
                _this.trigger("updated", { "row_labels_enabled":true, "label_width": lastLabelWidth });
                localStorage.setItem("row_labels_enabled", true);
            } else {
                btn.html("Show Row Labels");
                _this.trigger("updated", { "row_labels_enabled":false, "label_width": 0 });
                localStorage.setItem("row_labels_enabled", false);
            }
        });

        var lastChecked = localStorage.getItem("row_labels_enabled");
        if (!_.isUndefined(lastChecked) && lastChecked == "false") {
            this.$el.find(".show-labels").html("Show Row Labels");
            _this.trigger("updated", { "row_labels_enabled":false, "label_width": 0 });
        }
    },

    initialValue: function() {
        var rowLabelsEnabled = (!_.isEqual(localStorage.getItem("row_labels_enabled"), "false"));
        return {
            bar_height: parseInt(localStorage.getItem("slider_barheight") || 20),
            row_spacing: parseInt(localStorage.getItem("slider_rowspacing") || 10),
            bar_width: parseInt(localStorage.getItem("slider_barwidth") || 10),
            column_spacing: parseInt(localStorage.getItem("slider_barspacing") || 3),
            cluster_spacing: parseInt(localStorage.getItem("slider_clusterspacing") || 10),
            label_fontsize: parseInt(localStorage.getItem("slider_fontsize") || 10),
            label_width: (rowLabelsEnabled) ? parseInt(localStorage.getItem("slider_label_width") || 100) : 0,
            row_labels_enabled: rowLabelsEnabled
        }
    }
});
