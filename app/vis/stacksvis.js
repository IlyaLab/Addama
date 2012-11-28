!function ($) {
    // Definition
    var StacksVis = function (element, options) {
        this.element = $(element);
        if (options) _.extend(this, options);
    };

    StacksVis.prototype = {
        constructor:StacksVis,

        vertical_padding:30,
        horizontal_padding:30,
        label_width:100,
        label_fontsize:14,
        bar_height:20,
        bar_width:5,
        column_spacing:2,
        row_spacing:10,
        cluster_legend_height:20,
        cluster_spacing:10,
        highlight_bar_height:7,
        plot_height:1000,
        plot_width:1540,
        row_labels:[],
        cluster_labels:[],

        // Public Methods
        draw:function (data, options) {
            if (options) _.extend(this, options);

            this.element.empty();

            this._prepareData(data);
            this._updateClusterPositions();

            var vis = d3.select(this.element[0])
                .append("svg")
                .attr("width", this.plot_width + (2 * this.horizontal_padding))
                .attr("height", this.plot_height + (2 * this.vertical_padding));

            var data_area = vis
                .append("g")
                .attr("transform", "translate(" + this.horizontal_padding + "," + (this.vertical_padding + this.cluster_legend_height) + ")")
                .attr("width", this.plot_width)
                .attr("height", this.plot_height);

            // Ordinal scale for vertical placement of sample data and row labels
            this._updateRowLabelScale();
            this._updateRowIndexScale();

            // Ordinal scales for horizontal placement of sample data inside each cluster
            this._createClusterScales();

            var label_items = _.map(this.cluster_labels, function (d) {
                return { label:d, num_samples:this.columns_by_cluster[d].length }
            }, this);

            var that = this;
            this.cluster_g = data_area.selectAll("g.cluster-info")
                .data(label_items)
                .enter()
                .insert("g")
                .attr("class", "cluster-info")
                .attr("width", function (d) {
                    return d.num_samples;
                })
                .attr("transform", function (d) {
                    var position_info = that.cluster_position_by_label[d.label];
                    return "translate(" + (that.label_width + position_info.spacing + position_info.sample_pos * (that.bar_width + that.column_spacing)) + ", -20)";
                });

            this.cluster_g.append("text").attr("y", -5)
                .text(function (d) {
                    return d.label;
                }).attr("class", "cluster-label");

            // Display label on each row
            this.rows = data_area.selectAll("g.row-info")
                .data(this.row_labels)
                .enter()
                .append("g", "a")
                .attr("class", "row-info");

            this.rows.append("text")
                .attr("class", "row-label")
                .text(function (d) {
                    return d;
                })
                .style("font-size", this.label_fontsize + "px")
                .append("svg:title")
                .text(function (d) {
                    return d;
                });

            this.rows.style("display", function() {
                return (that.row_labels_enabled == true) ? "inline": "none";
            });

            this.cluster_columns = this.cluster_g.selectAll("g.cluster-column")
                .data(function (cluster_info) {
                    return _.map(that.columns_by_cluster[cluster_info.label], function (sample_label) {
                        return {
                            s:sample_label,
                            scale_get_fn:function () {
                                return that.cluster_scales[cluster_info.label];
                            },
                            values:that.data.samples[sample_label]
                        }
                    })
                }, function (d) {
                    return d.s;
                })
                .enter()
                .append("g")
                .attr("class", "cluster-column");

            this.sample_bars = this.cluster_columns.selectAll("rect.sample")
                .data(function (d) {
                    return d.values;
                });

            this.sample_bars.enter()
                .append("rect")
                .attr("class", "sample")
                .style("fill", this.color_fn)
                .attr("x", 0)
                .attr("width", this.bar_width)
                .attr("height", this.bar_height)
                .append("svg:title")
                .attr("class", "sample-label")
                .text(function (d) {
                    if (d !== undefined && d.label !== undefined) return d.label;
                    return "Not defined";
                });

            this.highlight_markers = this.cluster_columns.selectAll("rect.highlight")
                .data(function (d) {
                    var mutated = [];
                    _.each(d.values, function (cellvalue, index) {
                        if (cellvalue !== undefined && cellvalue.isMutated) {
                            mutated.push(index);
                        }
                    });
                    return mutated;
                })
                .enter()
                .append("rect")
                .attr("class", "highlight")
                .style("fill", this.highlight_fill)
                .attr("width", this.bar_width)
                .attr("x", 0)
                .attr("height", this.highlight_bar_height)
                .style("stroke-width", 0.0);

            this._updateVerticalScales();
            this._updateHorizontalScales();
        },

        update:function (options) {
            if (options) _.extend(this, options);

            if (_.has(options, "bar_height")) this._updateVerticalScales();
            if (_.has(options, "row_spacing")) this._updateVerticalScales();
            if (_.has(options, "row_labels")) this._updateVerticalScales();

            if (_.has(options, "bar_width")) {
                this._resetClusterScaleRanges();
                this._updateClusterPositions();
                this._updateHorizontalScales();
            }

            if (_.has(options, "column_spacing")) {
                this._resetClusterScaleRanges();
                this._updateClusterPositions();
                this._updateHorizontalScales();
            }

            if (_.has(options, "cluster_spacing")) {
                this._resetClusterScaleRanges();
                this._updateClusterPositions();
                this._updateHorizontalScales();
            }

            if (_.has(options, "label_fontsize")) {
                this.rows.selectAll("text.row-label").style("font-size", this.label_fontsize + "px");
            }

            if (_.has(options, "color_fn")) {
                this._updateColorFn();
            }

            if (_.has(options, "cluster_labels")) {
                this._updateClusterLabels();
            }

            if (_.has(options, "label_width")) {
                this._updateRowLabelWidth();
            }

            if (_.has(options, "row_labels_enabled")) {
                this._updateRowLabelVisibility();
            }
        },

        updateClusterColumns:function (cluster_id, sorted_columns) {
            this.cluster_scales[cluster_id] = d3.scale.ordinal().domain(sorted_columns).rangeBands([0, sorted_columns.length * (this.bar_width + this.column_spacing)]);

            this.cluster_columns.attr("transform", function (d) {
                return "translate(" + d.scale_get_fn()(d.s) + ",0)";
            });
        },

        // Private Methods
        _prepareData:function (samples) {
            var row_value_arrays = {};

            _.each(samples, function (sample_data, sample_name) {
                var values = [];

                _.each(this.row_labels, function (row_id) {
                    values.push(sample_data[row_id]);
                });

                row_value_arrays[sample_name] = values;
            }, this);

            var row_index_map = {};
            _.each(this.row_labels, function (d, i) {
                row_index_map[d] = i;
            });

            this.data = {
                "samples":row_value_arrays,
                "row_index_map":row_index_map
            };
        },

        _updateRowLabelScale:function () {
            this.row_label_scale = d3.scale.ordinal().domain(this.row_labels).rangeRoundBands([0, this.row_labels.length * (this.bar_height + this.row_spacing)]);
        },

        _updateRowIndexScale:function () {
            var data = this.data;
            var domain = _.map(this.row_labels, function (row_label) {
                return data.row_index_map[row_label];
            });

            this.row_index_scale = d3.scale.ordinal().domain(domain).rangeRoundBands([0, this.row_labels.length * (this.bar_height + this.row_spacing)]);
        },

        _updateClusterPositions:function () {
            var cluster_positions = _.reduce(this.cluster_labels, function (memo, cluster_id) {
                var last = memo.length > 0 ? memo[memo.length - 1] : 0;
                memo.push(last + this.columns_by_cluster[cluster_id].length);
                return memo;
            }, [], this);

            var cluster_position_by_label = {};
            cluster_position_by_label[this.cluster_labels[0]] = { sample_pos:0, spacing:0 };
            _.each(_.rest(this.cluster_labels), function (cluster_id, i) {
                cluster_position_by_label[cluster_id] = { sample_pos:cluster_positions[i], spacing:(i + 1) * this.cluster_spacing };
            }, this);

            this.cluster_position_by_label = cluster_position_by_label;
        },

        _createClusterScales:function () {
            var cluster_scales = {};
            _.each(this.columns_by_cluster, function (samples, key) {
                cluster_scales[key] = d3.scale.ordinal().domain(samples).rangeBands([0, samples.length * (this.bar_width + this.column_spacing)]);
            }, this);
            this.cluster_scales = cluster_scales;
        },

        _resetClusterScaleRanges:function () {
            _.each(this.columns_by_cluster, function (samples, key) {
                var current_domain = this.cluster_scales[key].domain();
                this.cluster_scales[key] = d3.scale.ordinal().domain(current_domain).rangeBands([0, samples.length * (this.bar_width + this.column_spacing)]);
            }, this);
        },

        _updateVerticalScales:function () {
            this._updateRowLabelScale();
            this._updateRowIndexScale();

            // Reset vertical locations of the row labels
            var that = this;
            this.rows
                .attr("transform", function (d) {
                    return "translate(0, " + that.row_label_scale(d) + ")";
                });

            this.cluster_columns.selectAll("rect.sample")
                .attr("y", function (d, i) {
                    return that.row_index_scale(i);
                })
                .attr("height", this.bar_height);

            var bar_offset = (this.bar_height / 2.0) - (this.highlight_bar_height / 2.0);
            var row_index_scale_fn = this.row_index_scale;
            this.cluster_columns.selectAll("rect.highlight")
                .attr("y", function (d) {
                    return row_index_scale_fn(d) + bar_offset;
                })
                .attr("height", this.highlight_bar_height);
        },

        _updateHorizontalScales:function () {
            var that = this;

            this.cluster_g
                .attr("transform", function (d) {
                    var position_info = that.cluster_position_by_label[d.label];
                    return "translate(" + (that.label_width + position_info.spacing + position_info.sample_pos * (that.bar_width + that.column_spacing)) + ", -20)";
                });

            this.cluster_columns
                .attr("transform", function (d) {
                    return "translate(" + d.scale_get_fn()(d.s) + ",0)";
                });

            this.sample_bars.attr("width", this.bar_width).attr("height", this.bar_height);

            this.highlight_markers.attr("width", this.bar_width);
        },

        _updateClusterLabels:function () {
            this._updateClusterPositions();

            var that = this;
            this.cluster_g
                .attr("transform", function (d) {
                    var position_info = that.cluster_position_by_label[d.label];
                    return "translate(" + (that.label_width + position_info.spacing + position_info.sample_pos * (that.bar_width + that.column_spacing)) + ", -20)";
                });
        },

        _updateColorFn:function () {
            this.sample_bars.style("fill", this.color_fn);
        },

        _updateRowLabelWidth:function() {
            var that = this;

            this.cluster_g
                .attr("transform", function (d) {
                    var position_info = that.cluster_position_by_label[d.label];
                    return "translate(" + (that.label_width + position_info.spacing + position_info.sample_pos * (that.bar_width + that.column_spacing)) + ", -20)";
                });
        },

        _updateRowLabelVisibility:function() {
            var that = this;
            this.rows.style("display", function() {
                if (that.row_labels_enabled == true) {
                    return "inline";
                }
                else {
                    return "none";
                }
            });
        }
    };

    // jQuery Plugin
    $.fn.stacksvis = function (data, options) {
        var $this = $(this);
        var vis = $this.data("StacksVis");
        if (!vis) $this.data("StacksVis", (vis = new StacksVis(this, options)));

        if (typeof data == "string") {
            if (data == "update") vis.update(options);
            if (data == "cluster_columns") vis.updateClusterColumns(options["cluster"], options["columns"]);
        } else {
            vis.draw(data, options);
        }
    };
}(window.jQuery);