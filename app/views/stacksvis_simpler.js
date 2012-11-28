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

    getColumnModel:function () {
        if (_.isEmpty(this.model.get("ROWS"))) return {};
        if (_.isEmpty(this.model.get("COLUMNS"))) return {};
        if (_.isEmpty(this.model.get("DATA"))) return {};

        var _this = this;
        this.rowLabels = _.filter(this.model.get("ROWS"), function(row) {
            return (_this.genes.indexOf(row) >= 0);
        });

        var unsorted_columns = [];
        _.each(this.model.get("COLUMNS"), function (column_name, col_idx) {
            var column = { "name":column_name.trim(), "cluster":"_", "values":[] };
            _.each(this.rowLabels, function (row_label) {
                var row_idx = this.model.get("ROWS").indexOf(row_label);
                var value = this.model.get("DATA")[row_idx][col_idx];
                if (_.isString(value)) {
                    value = value.trim().toLowerCase();
                }
                column.values.push(value);
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

    renderGraph:function () {
        this.initControls();
        if (_.isEmpty(this.model.get("ROWS"))) return;
        if (_.isEmpty(this.model.get("COLUMNS"))) return;
        if (_.isEmpty(this.model.get("DATA"))) return;

        if (_.isEmpty(this.rowLabels)) {
            var rows = this.model.get("ROWS");
            this.rowLabels = _.first(rows, (rows.length < this.defaultRows) ? rows.length : this.defaultRows);
        }

        var columns_by_cluster = this.getColumnModel();
        var data = {};
        _.each(this.rowLabels, function (rowLabel) {
            var row_idx = this.model.get("ROWS").indexOf(rowLabel);
            var categories = _.uniq(this.model.get("DATA")[row_idx]);
            var numberOfCategories = (categories.length < 3) ? 3 : categories.length;

            var colorscales = function (cell) {
                return colorbrewer.YlOrBr[numberOfCategories][categories.indexOf(cell)];
            };
            if (numberOfCategories > 7) {
                var colorscaleFn = d3.scale.ordinal().domain(categories)
                    .range(d3.range(categories.length)
                    .map(d3.scale.linear().domain([0, categories.length - 1])
                    .range(["forestgreen", "lightgreen"])
                    .interpolate(d3.interpolateLab)));
                colorscales = function (cell) {
                    return colorscaleFn(categories.indexOf(cell));
                }
            }

            _.each(this.model.get("DATA")[row_idx], function (cell, cellIdx) {
                if (_.isString(cell)) cell = cell.trim();
                var columnLabel = this.model.get("COLUMNS")[cellIdx].trim();
                if (!data[columnLabel]) data[columnLabel] = {};
                data[columnLabel][rowLabel] = { "value":cell, "row":rowLabel, "colorscale":colorscales(cell), "label":columnLabel + "\n" + rowLabel + "\n" + cell };
            }, this);
        }, this);

        var optns = {
            vertical_padding:0,
            horizontal_padding:0,
            label_width:100,
            label_fontsize:12,
            plot_height:600,
            plot_width:800,
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

    initControls:function () {
        this.controls = new ControlsView();
        $("body").append(this.controls.render().el);

        var vis_container = this.$el.find(".stacksvis-container");
        this.controls.on("updated", function (dim) {
            vis_container.stacksvis("update", dim);
        });
    }
});
