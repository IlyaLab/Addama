var View = require('./view');
var template = require('./templates/oncovis');
var FeatureMatrix2 = require('../models/featureMatrix2');
var ALL_COLUMNS = "ALL_COLUMNS";

module.exports = View.extend({
    model:FeatureMatrix2,
    template:template,
    label:"Oncovis",
    className:"row-fluid",
    clusterProperty: null,
    rowLabels:[],

    events:{
        "click .reset-sliders":"resetSliders"
    },

    initialize:function () {
        _.bindAll(this, 'renderGraph', 'initControls', 'render', 'resetSliders', 'onNewRows');

        this.renderGraph = _.after(2, this.renderGraph);
        this.model.on('load', this.renderGraph);
        this.model.dims.on('load', this.renderGraph);
    },

    afterRender:function () {
        this.initControls();
        this.initClusterProperty();
        this.initRowSelector();
    },

    initControls:function () {
        console.log("initControls:start");

        this.$el.find(".slider_barheight").oncovis_range({ storageId:"slider_barheight", min:10, max:50, initialStep:20 });
        this.$el.find(".slider_rowspacing").oncovis_range({ storageId:"slider_rowspacing", min:10, max:50, initialStep:10 });
        this.$el.find(".slider_barwidth").oncovis_range({ storageId:"slider_barwidth", min:1, max:10, initialStep:3 });
        this.$el.find(".slider_barspacing").oncovis_range({ storageId:"slider_barspacing", min:0, max:10, initialStep:1 });
        this.$el.find(".slider_clusterspacing").oncovis_range({ storageId:"slider_clusterspacing", min:0, max:50, initialStep:10 });
        this.$el.find(".slider_fontsize").oncovis_range({ storageId:"slider_fontsize", min:5, max:21, initialStep:10 });

        var oncovis_container = this.$el.find(".oncovis-container");
        var visrangeFn = function (property) {
            return function (event, value) {
                var dim = {};
                dim[property] = value;
                oncovis_container.update(dim);
            }
        };

        this.$el.find(".slider_barheight").on("slide-to", visrangeFn("bar_height"));
        this.$el.find(".slider_rowspacing").on("slide-to", visrangeFn("row_spacing"));
        this.$el.find(".slider_barwidth").bind("slide-to", visrangeFn("bar_width"));
        this.$el.find(".slider_barspacing").bind("slide-to", visrangeFn("column_spacing"));
        this.$el.find(".slider_clusterspacing").bind("slide-to", visrangeFn("cluster_spacing"));
        this.$el.find(".slider_fontsize").bind("slide-to", visrangeFn("label_fontsize"));

        console.log("initControls:end");
    },

    initClusterProperty: function() {
        var OCPView = require("../views/oncovis_cluster_property");
        var ocpview = new OCPView({ model: model });
        this.$el.find('.cluster-property-modal').html(ocpview.render().el);

        var _this = this;
        ocpview.on("selected-cluster", function(cluster) {
            _this.clusterProperty = cluster;
            _this.$el.find('.cluster-property-modal').modal("hide");
            _this.model.trigger("load");
        });
        ocpview.on("no-cluster", function() {
            _this.clusterProperty = ALL_COLUMNS;
            _this.$el.find('.cluster-property-modal').modal("hide");
            _this.model.trigger("load");
        });
    },

    initRowSelector: function() {
        var OSRView = require("../views/oncovis_select_rows");
        var osrview = new OSRView({ model: model });
        this.$el.find('.select-rows-modal').html(osrview.render().el);

        var _this = this;
        osrview.on("selected-rows", function(rows) {
            console.log("selected-rows=" + rows);
            _this.rowLabels = rows;
            _this.$el.find('.select-rows-modal').modal("hide");
            _this.model.trigger("load");
        });
    },

    getColumnModel:function () {
        var _this = this;
        var unsorted_columns = [];
        var cluster_property = (this.clusterProperty || this.model.dims.get("clusterProperty"));
        if (cluster_property == ALL_COLUMNS) {
            _.each(this.model.get("COLUMNS"), function (column_name, col_idx) {
                var column = { "name":column_name.trim(), "cluster":"All Columns", "values":[] };
                _.each(_this.rowLabels, function (row_label) {
                    var row_idx = _this.model.get("ROWS").indexOf(row_label);
                    column.values.push(_this.model.get("DATA")[row_idx][col_idx].trim().toLowerCase());
                });
                unsorted_columns.push(column);
            });
        } else {
            _.each(this.model.get("COLUMNS"), function (column_name, col_idx) {
                var cluster_idx = _this.model.get("ROWS").indexOf(cluster_property);
                var cluster_value = _this.model.get("DATA")[cluster_idx][col_idx].trim();
                var column = { "name":column_name.trim(), "cluster":cluster_value, "values":[cluster_value] };
                _.each(_this.rowLabels, function (row_label) {
                    var row_idx = _this.model.get("ROWS").indexOf(row_label);
                    column.values.push(_this.model.get("DATA")[row_idx][col_idx].trim().toLowerCase());
                });
                unsorted_columns.push(column);
            });
        }

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
        console.log("renderGraph:start");
        if (!this.rowLabels || !this.rowLabels.length) {
            // reset to original
            this.rowLabels = this.model.dims.get("rowLabels");
        }

        var columns_by_cluster = this.getColumnModel();
        var data = {};
        var _this = this;
        _.each(this.rowLabels, function (rowLabel) {
            var row_idx = _this.model.get("ROWS").indexOf(rowLabel);
            var categories = _.uniq(_this.model.get("DATA")[row_idx]);
            var numberOfCategories = (categories.length < 3) ? 3 : categories.length;

            var colorscales = function (cell) {
                return colorbrewer.YlOrBr[numberOfCategories][categories.indexOf(cell)];
            };
            if (numberOfCategories > 7) {
                var colorscaleFn = d3.scale.ordinal().domain(categories)
                    .range(d3.range(categories.length)
                    .map(d3.scale.linear().domain([0, categories.length - 1])
                    .range(["yellow", "green"])
                    .interpolate(d3.interpolateLab)));
                colorscales = function (cell) {
                    return colorscaleFn(categories.indexOf(cell));
                }
            }

            _.each(_this.model.get("DATA")[row_idx], function (cell, cellIdx) {
                cell = cell.trim();
                var columnLabel = _this.model.get("COLUMNS")[cellIdx].trim();
                if (!data[columnLabel]) data[columnLabel] = {};
                data[columnLabel][rowLabel] = { "value":cell, "row":rowLabel, "colorscale":colorscales(cell), "label":columnLabel + "\n" + rowLabel + "\n" + cell };
            });
        });

        var optns = {
            plot_width:3000,
            plot_height:3000,
            label_width:70,
            highlight_fill:colorbrewer.RdYlGn[3][2],
            color_fn:function (d) {
                return d ? d.colorscale : "white";
            },
            columns_by_cluster:columns_by_cluster,
            cluster_labels:_.keys(columns_by_cluster),
            row_labels:this.rowLabels,
            // initial values based on slider defaults
            bar_height:this.$el.find(".slider_barheight").oncovis_range("value"),
            row_spacing:this.$el.find(".slider_rowspacing").oncovis_range("value"),
            bar_width:this.$el.find(".slider_barwidth").oncovis_range("value"),
            column_spacing:this.$el.find(".slider_barspacing").oncovis_range("value"),
            cluster_spacing:this.$el.find(".slider_clusterspacing").oncovis_range("value"),
            label_fontsize:this.$el.find(".slider_fontsize").oncovis_range("value")
        };

        this.$el.find(".oncovis-container").oncovis(data, optns);

        console.log("renderGraph:end");
    },

    onNewRows:function (genelist) {
        if (genelist && genelist.values) {
            var _this = this;
            _.defer(function () {
                _this.rowLabels = _.filter(_this.model.get("ROWS"), function (row) {
                    return _.any(genelist.values, function (gene) {
                        return (row.toLowerCase().indexOf(gene.toLowerCase()) >= 0);
                    });
                });
                console.log("reload-model");
                _this.model.trigger('load');
            });
        }
    },

    resetSliders:function () {
        this.$el.find(".slider_barheight").oncovis_range("reset");
        this.$el.find(".slider_rowspacing").oncovis_range("reset");
        this.$el.find(".slider_barwidth").oncovis_range("reset");
        this.$el.find(".slider_barspacing").oncovis_range("reset");
        this.$el.find(".slider_clusterspacing").oncovis_range("reset");
        this.$el.find(".slider_fontsize").oncovis_range("reset");
    }
});
