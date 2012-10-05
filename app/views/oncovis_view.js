var View = require('./view');
var template = require('./templates/oncovis');
var FeatureMatrix = require('../models/featureMatrix');

module.exports = View.extend({
    model:FeatureMatrix,
    template:template,
    label:"Oncovis",
    className: "row-fluid",

    events:{
        "click .reset-sliders":"resetSliders"
    },

    initialize:function () {
        _.bindAll(this, 'renderGraph', 'initControls', 'render', 'resetSliders');
    },

    afterRender:function () {
        var _this = this;
        this.initControls();
        this.model.on('load', _this.renderGraph);
    },

    renderGraph:function () {
        this.initControls();

        console.log("renderGraph:start");

        var rowLabels = this.model.dims.getRowLabels();
        var clusterGroups = {};

        var cluster_idx = this.model.ROWS.indexOf(this.model.dims.getClusterProperty());
        _.each(this.model.DATA[cluster_idx], function(cell, idx) {
            if (!clusterGroups[value]) clusterGroups[value] = [];
            clusterGroups[value].push(idx);
        });

        var columns_by_cluster = {};
        var _this = this;
        _.each(clusterGroups, function(column_idxs, cluster) {
            columns_by_cluster[cluster] = _.sortBy(column_idxs, function(column_idx) {
                return _.map(rowLabels, function(rowLabel) {
                    var row_idx = _this.model.ROWS.indexOf(rowLabel);
                    var value = _this.model.DATA[row_idx][column_idx];
                    return (value && value.toLowerCase) ? value.toLowerCase() : value;
                });
            });
        });

        var categories_by_rowlabel = {};
        _.each(rowLabels, function(rowLabel) {
            categories_by_rowlabel[rowLabel] = {};
            var row_idx = _this.model.ROWS.indexOf(rowLabel);
            _.each(_this.model.DATA[row_idx], function(cell) {
                categories_by_rowlabel[rowLabel][cell] = true;
            });
        });

        var colorscales_by_rowlabel = { overrides: {} };
        _.each(categories_by_rowlabel, function(obj, rowLabel) {
            var categories = _.keys(obj);
            colorscales_by_rowlabel[rowLabel] = d3.scale.ordinal()
                                                          .domain(categories)
                                                          .range(d3.range(categories.length)
                                                          .map(d3.scale.linear().domain([0, categories.length - 1])
                                                          .range(["yellow", "blue"])
                                                          .interpolate(d3.interpolateLab)));
        });

        var optns = {
            bar_width:4,
            column_spacing:1,
            plot_width:3000,
            label_width:70,
            highlight_fill:colorbrewer.RdYlGn[3][2],
            color_fn:function (d) {
                if (d) {
                    return colorscales_by_rowlabel[d.row](d.value);
                }
                return "white";
            },
            columns_by_cluster:clusterGroups,
            cluster_labels: _.keys(clusterGroups),
            row_labels:rowLabels
        };

        _.extend(optns, { "bar_height":this.$el.find(".slider_barheight").oncovis_range_value() });
        _.extend(optns, { "row_spacing":this.$el.find(".slider_rowspacing").oncovis_range_value() });
        _.extend(optns, { "bar_width":this.$el.find(".slider_barwidth").oncovis_range_value() });
        _.extend(optns, { "column_spacing":this.$el.find(".slider_barspacing").oncovis_range_value() });
        _.extend(optns, { "cluster_spacing":this.$el.find(".slider_clusterspacing").oncovis_range_value() });
        _.extend(optns, { "label_fontsize":this.$el.find(".slider_fontsize").oncovis_range_value() });

        this.$el.find(".oncovis-container").oncovis(this.model.DATA, optns);

        this.renderLegend(categories_by_rowlabel, colorscales_by_rowlabel);

        console.log("renderGraph:end");
    },

    renderLegend: function(categories_by_rowlabel, colorscales_by_rowlabel) {
        console.log("renderLegend:start");

        var accordionEl = this.$el.find(".oncovis-legend");
        _.each(categories_by_rowlabel, function(obj, rowLabel) {
            var categories = _.keys(obj);
            accordionEl.append("<h5><a href='#'>" + rowLabel + "</a></h5>");
            var lis = [];
            _.each(categories, function(category) {
                var color = colorscales_by_rowlabel[rowLabel](category);
                lis.push("<li><span data-row='" + rowLabel + "' data-ref='" + category + "' class='color-category' style='background-color:" + color + "'>&nbsp;&nbsp;&nbsp;</span>" + category + "</li>");
            });
            accordionEl.append("<ul>" + lis.join("") + "</ul>");
        });

        accordionEl.accordion({ "collapsible": true, "autoHeight": false });

        var oncovis_container = this.$el.find(".oncovis-container");

        $(".color-selection").live("click", function(e) {
            var data = $(e.target).data();
            var row = data["row"];
            var ref = data["ref"];
            var color = data["color"];

            if (!colorscales_by_rowlabel.overrides[row]) colorscales_by_rowlabel.overrides[row] = {};
            colorscales_by_rowlabel.overrides[row][ref] = color;

            oncovis_container.update({
                color_fn: function(d) {
                    if (colorscales_by_rowlabel.overrides[d.row] && colorscales_by_rowlabel.overrides[d.row][d.value]) {
                        return colorscales_by_rowlabel.overrides[d.row][d.value];
                    }
                    return colorscales_by_rowlabel[d.row](d.value);
                }
            });

            _.each($(".color-category"), function(cc) {
                var el = $(cc);
                if (el.data()["row"] == row && el.data()["ref"] == ref) cc.style["background-color"] = color;
            });

            $(".color-category").popover("hide");
        });

        $(".color-category").popover({
            placement: "left",
            title: function() {
                return "Color Selection (" + $(this).data()["ref"] + ")";
            },
            content: function() {
                var row = $(this).data()["row"];
                var ref = $(this).data()["ref"];


                var addColorSpan = function(color) {
                    return "<span class='color-selection' style='background-color:" + color + "' data-row='" + row + "' data-color='" + color + "' data-ref='" + ref + "'>&nbsp;&nbsp;&nbsp;</span>";
                };
                var html = "";
                html += "<ul>";
                html += addColorSpan("red");
                html += addColorSpan("blue");
                html += addColorSpan("green");
                html += addColorSpan("yellow");
                html += addColorSpan("lightgray");
                html += addColorSpan("lightgreen");
                html += addColorSpan("lightblue");
                html += "</ul>";
                return html;
            }
        });

        console.log("renderLegend:end");
    },

    initControls:function () {
        console.log("initControls:start");
        var me = this;
        var visrangeFn = function (property) {
            return function (value) {
                var dim = {};
                dim[property] = value;
                me.$el.find(".oncovis-container").update(dim);
            }
        };

        this.$el.find(".slider_barheight").oncovis_range({ storageId:"slider_barheight", min:10, max:50, initialStep:20, slide:visrangeFn("bar_height") });
        this.$el.find(".slider_rowspacing").oncovis_range({ storageId:"slider_rowspacing", min:0, max:50, initialStep:10, slide:visrangeFn("row_spacing") });
        this.$el.find(".slider_barwidth").oncovis_range({ storageId:"slider_barwidth", min:1, max:10, initialStep:5, slide:visrangeFn("bar_width") });
        this.$el.find(".slider_barspacing").oncovis_range({ storageId:"slider_barspacing", min:0, max:10, initialStep:2, slide:visrangeFn("column_spacing") });
        this.$el.find(".slider_clusterspacing").oncovis_range({ storageId:"slider_clusterspacing", min:0, max:50, initialStep:10, slide:visrangeFn("cluster_spacing") });
        this.$el.find(".slider_fontsize").oncovis_range({ storageId:"slider_fontsize", min:5, max:21, initialStep:14, slide:visrangeFn("label_fontsize") });

        console.log("initControls:end");
    },

    resetSliders:function () {
        this.$el.find(".slider_barheight").oncovis_range_reset();
        this.$el.find(".slider_rowspacing").oncovis_range_reset();
        this.$el.find(".slider_barwidth").oncovis_range_reset();
        this.$el.find(".slider_barspacing").oncovis_range_reset();
        this.$el.find(".slider_clusterspacing").oncovis_range_reset();
        this.$el.find(".slider_fontsize").oncovis_range_reset();
    }
});
