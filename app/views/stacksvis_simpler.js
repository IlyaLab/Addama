var Template = require("../views/templates/stacksvis_simpler");
var ControlsView = require("../views/stacksvis_controls");
require("../../vis/stacksvis");

module.exports = Backbone.View.extend({
    defaultRows:30,
    rowLabels:[],

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderGraph", "initControls", "getColumnModel");

        this.model.on("load", this.renderGraph);

        this.$el.html(Template());
    },

    renderGraph:function () {
        this.initControls();
        var cancerModel = this.model.get("DATA_BY_CANCER")[this.cancers[0].toLowerCase()];
        if (_.isEmpty(cancerModel.ROWS)) return;
        if (_.isEmpty(cancerModel.COLUMNS)) return;
        if (_.isEmpty(cancerModel.DATA)) return;

        this.rowLabels = this.genes;

        var columns_by_cluster = this.getColumnModel(cancerModel);
        var data = {};
        var cbscale = colorbrewer.RdYlBu[5];

        _.each(this.rowLabels, function (rowLabel) {
            var row_idx = cancerModel.ROWS.indexOf(rowLabel.toLowerCase());
            _.each(cancerModel.DATA[row_idx], function (cell, cellIdx) {
                if (_.isString(cell.orig)) cell.orig = cell.orig.trim();
                var columnLabel = cancerModel.COLUMNS[cellIdx].trim();
                if (!data[columnLabel]) data[columnLabel] = {};
                data[columnLabel][rowLabel] = { "value":cell.value, "row":rowLabel, "colorscale":cbscale[cell.value], "label":columnLabel + "\n" + rowLabel + "\n" + cell.orig };
            }, this);
        }, this);

        var optns = {
            vertical_padding:1,
            horizontal_padding:1,
            label_width:100,
            label_fontsize:12,
            plot_height:300,
            plot_width:600,
            highlight_fill:colorbrewer.RdYlGn[3][2],
            color_fn:function (d) {
                return d ? d.colorscale : "white";
            },
            columns_by_cluster:columns_by_cluster,
            cluster_labels:_.keys(columns_by_cluster),
            row_labels:this.rowLabels
        };

        this.$el.find(".stacksvis-container").stacksvis(data, _.extend(optns, this.controls.initialValue()));
    },

    getColumnModel:function (cancerModel) {
        var discretizeFn = function (val) {
            if (_.isNumber(val)) {
                if (val < -1.5) return 4;
                if (val < -0.5) return 3;
                if (val < 0.5) return 2;
                if (val < 1.5) return 1;
                return 0;
            }
            return val;
        };

        _.each(cancerModel.DATA, function(outer_array, idx) {
            cancerModel.DATA[idx] = _.map(outer_array, function(x) {
                return { "value": discretizeFn(x), "orig": x };
            });
        });

        var unsorted_columns = [];
        _.each(cancerModel.COLUMNS, function (column_name, col_idx) {
            var column = { "name":column_name.trim(), "cluster":"_", "values":[] };
            _.each(this.rowLabels, function (row_label) {
                var row_idx = cancerModel.ROWS.indexOf(row_label.toLowerCase());
                var cell = cancerModel.DATA[row_idx][col_idx];
                if (_.isString(cell.orig)) {
                    cell.orig = cell.orig.trim().toLowerCase();
                }
                column.values.push(cell.value);
            }, this);
            unsorted_columns.push(column);
        }, this);

        var sorted_columns = _.sortBy(unsorted_columns, "values");
        var grouped_columns = _.groupBy(sorted_columns, "cluster");

        var columns_by_cluster = {};
        _.each(grouped_columns, function (values, key) {
            columns_by_cluster[key] = [];
            _.each(values, function (value) {
                columns_by_cluster[key].push(value.name);
            })
        });

        return columns_by_cluster;
    },

    initControls:function () {
        this.controls = new ControlsView();
        $("body").append(this.controls.render().el);

        var vis_container = this.$el.find(".stacksvis-container");
        this.controls.on("updated", function (dim) {
            vis_container.stacksvis("update", dim);
        });
    }
});
