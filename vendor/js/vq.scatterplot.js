vq.ScatterPlot = function() {
    vq.Vis.call(this);
};

vq.ScatterPlot.prototype = vq.extend(vq.Vis);

vq.ScatterPlot.prototype.setRegression = function(obj) {
    this.data._regression = obj || 'none';
    this._render();
};

vq.ScatterPlot.prototype.getScales = function(data_array) {
    var dataObj = this.data;

    var x = dataObj.COLUMNID.x;
    var y = dataObj.COLUMNID.y;

    var minX = data_array.reduce(function(previous, current) {
        return (current[x] != null) && current[x] < previous ? current[x] : previous;
    }, 999999);
    var maxX = data_array.reduce(function(previous, current) {
        return (current[x] != null) && current[x] > previous ? current[x] : previous;
    }, -999999);
    var minY = data_array.reduce(function(previous, current) {
        return (current[y] != null) && current[y] < previous ? current[y] : previous;
    }, 999999);
    var maxY = data_array.reduce(function(previous, current) {
        return (current[y] != null) && current[y] > previous ? current[y] : previous;
    }, -999999);

    //expand plot around highest/lowest values
    var showMinX = minX - (Math.abs(maxX - minX) * 0.03);
    var showMaxX = maxX + (Math.abs(maxX - minX) * 0.03);
    var showMinY = minY - (Math.abs(maxY - minY) * 0.03);
    var showMaxY = maxY + (Math.abs(maxY - minY) * 0.03);

    // Start D3.js code
    var xScale = d3.scale.linear().domain([showMinX, showMaxX]).range([0, dataObj._plot.width]);
    var yScale = d3.scale.linear().domain([showMinY, showMaxY]).range([dataObj._plot.height, 0]);

    return {
        x: xScale,
        y: yScale,
        showMaxX: showMaxX,
        showMinX: showMinX,
        showMaxY: showMaxY,
        showMinY: showMinY
    };
};

vq.ScatterPlot.prototype.draw = function(data) {
    var that = this;
    this.data = new vq.models.ScatterPlotData(data);

    if (!this.data.isDataReady()) { return;}

    var dataObj = this.data;

    var x = dataObj.COLUMNID.x;
    var y = dataObj.COLUMNID.y;
    var value = dataObj.COLUMNID.value;

    var width = dataObj._plot.width;
    var height = dataObj._plot.height;

    this.x = x;
    this.y = y;
    this.value = value;

    this.data_array = dataObj.data;

    // Start D3.js code
    var scales = this.getScales(this.data_array);
    this.xScale = scales.x;
    this.yScale = scales.y;

    // Regression line
    this.regressData = this.getRegressData(scales);

    this.vis = d3.select(dataObj._plot.container)
        .append("svg")
        .attr("width", width + 2 * dataObj.horizontal_padding)
        .attr("height", height + 2 * dataObj.vertical_padding);

    this.data_area = this.vis
        .append("g")
        .attr("transform", "translate(" + dataObj.horizontal_padding + "," + dataObj.vertical_padding + ")")
        .attr("width", width)
        .attr("height", height);

    // Rectangle around the scale lines.
    // Also used for zoom mouse events.
    this.data_rect = this.data_area
        .append("rect")
        .attr("class", "data-rect")
        .attr("width", width)
        .attr("height", height)
        .attr("stroke", "#aaaaaa")
        .attr("stroke-width", 1.5)
        .attr("fill-opacity", 0.0)
        .attr("pointer-events", "all");

    // Add the Y-axis label
    this.data_area.append("g")
        .append("text")
        .attr("class", "axis")
        .text(dataObj.COLUMNLABEL.y)
        .style("font", dataObj._axisFont)
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + dataObj.yLabelDisplacement + "," + height / 2 +") rotate(-90)");

    // Add the X-axis label
    this.data_area.append("text")
        .attr("class", "axis")
        .text(dataObj.COLUMNLABEL.x)
        .style("font", dataObj._axisFont)
        .attr("x", width / 2)
        .attr("y", height + dataObj.xLabelDisplacement)
        .style("text-anchor", "middle");

    // Clipping container for data points and regression line
    var symbols = this.data_area.append("svg")
        .attr("left", 0)
        .attr("top", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("class", "symbols");

    this.brush = d3.svg.brush();

    this._render();
};

vq.ScatterPlot.prototype.getRegressData = function(scaleInfo) {
    var dataObj = this.data;
    var x = this.x;
    var y = this.y;

    var regress = dataObj._regression;

    if (regress == 'none') {
        return {
            type: regress
        };
    }
    else if (regress == 'linear') {
        var valid_data = this.data.data.filter(function(d, e, f) {
                return (d[y] && d[x]);
            }),
            sum_x = d3.sum(valid_data, function(d) {
                return d[x];
            }),
            sum_y = d3.sum(valid_data, function(d) {
                return d[y];
            }),
            sum_x2 = d3.sum(valid_data, function(d) {
                return d[x] * d[x];
            }),
            sum_xy = d3.sum(valid_data, function(d) {
                return d[x] * d[y];
            }),
            slope = ((valid_data.length * sum_xy) - (sum_x * sum_y)) / ((valid_data.length * sum_x2) - (sum_x * sum_x));

        var intercept = (sum_y - slope * sum_x) / valid_data.length;

        var line_minX = scaleInfo.showMinX * 0.95;
        var line_maxX = scaleInfo.showMaxX * 1.05;
        var line_maxY = slope * line_maxX + intercept;
        var line_minY = slope * line_minX + intercept;

        var lineArray = d3.scale.linear().domain([line_minX, line_maxX]).range([line_minY, line_maxY]);

        return {
            type: regress,
            minX: line_minX,
            maxX: line_maxX,
            scale: lineArray
        };
    }
};

vq.ScatterPlot.prototype._render = function() {
    this.updateScales({
        x: this.xScale,
        y: this.yScale
    }, true);
};

vq.ScatterPlot.prototype.updateScales = function(scaleInfo, disableTransition) {
    var that = this;
    var dataObj = this.data;
    var enable = dataObj.enableTransitions && (!disableTransition),
        y_trans,
        y_trans_enter,
        y_ticks,
        y_ticks_enter,
        y_ticks_exit,
        x_trans,
        x_trans_enter,
        x_ticks,
        x_ticks_enter,
        x_ticks_exit;
    var dr = dataObj.transitionDuration;
    var x, x_mid, y, y_mid;

    var width = dataObj._plot.width,
        height = dataObj._plot.height;

    x = scaleInfo.x;
    x_mid = (x.domain()[0] + x.domain()[1]) / 2.0;

    y = scaleInfo.y;
    y_mid = (y.domain()[0] + y.domain()[1]) / 2.0;

    // Y-axis ticks
    y_trans = function(d) {
        return "translate(0," + y(d) + ")";
    };

    y_trans_enter = function(d) {
        if (d > y_mid) {
            return "translate(0,0)"
        }
        else {
            return "translate(0," + height + ")";
        }
    };

    y_ticks = this.data_area.selectAll("g.y-tick")
        .data(y.ticks(10), String);
    y_ticks_enter = y_ticks.enter();
    y_ticks_exit = y_ticks.exit();

    if (enable) {
        y_ticks = y_ticks.transition()
            .duration(dr);
    }

    y_ticks.attr("transform", y_trans);

    y_ticks_enter = y_ticks_enter.insert("g", "a")
        .attr("class", "y-tick")
        .attr("transform", y_trans_enter)
        .style("opacity", 1e-6);

    y_ticks_enter.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("stroke", "#ccc");

    y_ticks_enter.append("text")
        .attr("x", dataObj.yTickDisplacement)
        .style("font", dataObj._tickFont)
        .attr("text-anchor", "end")
        .text(d3.format("3.2f"));

    if (enable) {
        y_ticks_enter = y_ticks_enter.transition()
            .duration(dr);
        y_ticks_exit = y_ticks_exit.transition()
            .duration(dr)
            .style("opacity", 1e-6);
    }

    y_ticks_enter
        .attr("transform", y_trans)
        .style("opacity", 1.0);

    y_ticks_exit
        .remove();

    // X-axis ticks
    x_trans = function(d) {
        return "translate(" + x(d) + ",0)";
    };

    x_trans_enter = function(d) {
        if (d < x_mid) {
            return "translate(0,0)"
        }
        else {
            return "translate(" + width + ",0)";
        }
    };

    x_ticks = this.data_area.selectAll("g.x-tick")
        .data(x.ticks(10), Number);
    x_ticks_enter = x_ticks.enter();
    x_ticks_exit = x_ticks.exit();

    if (enable) {
        x_ticks = x_ticks.transition()
            .duration(dr);
    }

    x_ticks.attr("transform", x_trans);

    x_ticks_enter = x_ticks_enter.insert("g", "a")
        .attr("class", "x-tick")
        .attr("transform", x_trans_enter)
        .style("opacity", 1e-6);

    x_ticks_enter.append("line")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#ccc");

    x_ticks_enter.append("text")
        .attr("y", height + dataObj.xTickDisplacement)
        .style("font", dataObj._tickFont)
        .attr("text-anchor", "middle")
        .text(d3.format("3.2f"));

    if (enable) {
        x_ticks_enter = x_ticks_enter.transition()
            .duration(dr);
        x_ticks_exit = x_ticks_exit.transition()
            .duration(dr)
            .style("opacity", 1e-6);
    }

    x_ticks_enter
        .attr("transform", x_trans)
        .style("opacity", 1.0);

    x_ticks_exit
        .remove();

    this.xScale = x;
    this.yScale = y;

    that.updateData(disableTransition);
};

vq.ScatterPlot.prototype.updateData = function(disableTransition) {
    var that = this;
    var data_array = this.data.data;
    var dataObj = this.data;
    var dr = this.data.transitionDuration;
    var enable = dataObj.enableTransitions && (!disableTransition);

    // Dots
    var dots = this.data_area.select("svg.symbols")
        .selectAll("circle")
        .data(data_array, function(d) {
            return "" + d[that.x] + d[that.y];
        });

    var dots_enter = dots.enter().append("circle")
        .attr("class", "fg")
        .attr("cx", function(d) {return that.xScale(d[that.x])})
        .attr("cy", function(d) {return that.yScale(d[that.y])})
        .attr("r", dataObj._radius)
        .call(_.bind(this.setDefaultSymbolStyle, this))
        .style("opacity", 1e-6);

    dots_enter.append("title")
        .text(function(d) {
            return dataObj.COLUMNLABEL.value + ' ' + d[that.value];
        });

    if (enable) {
        dots_enter = dots_enter.transition()
            .duration(dr);
    }

    dots_enter.style("opacity", 1.0);

    // Adjust positions
    dots.attr("cx", function(d) {return that.xScale(d[that.x])})
        .attr("cy", function(d) {return that.yScale(d[that.y])});

    var dots_exit = dots.exit();

    if (enable) {
        dots_exit = dots.exit().transition()
            .duration(dr)
            .style("opacity", 1e-6);
    }

    dots_exit.remove();

    // Adjust regression line on zoom
    var rd = that.regressData;
    if (rd.type == 'linear') {
        var regress_lines = this.data_area.select("svg.symbols")
            .selectAll("line.regression")
            .data([{
                x1: that.xScale(rd.minX),
                y1: that.yScale(rd.scale(rd.minX)),
                x2: that.xScale(rd.maxX),
                y2: that.yScale(rd.scale(rd.maxX))
        }], function(d) { return "" + d.x1 + d.x2 + d.y1 + d.y2; });

        var regress_lines_enter = regress_lines.enter()
            .append("line")
            .attr("class", "regression")
            .attr("x1", function(d) { return d.x1; })
            .attr("y1", function(d) { return d.y1; })
            .attr("x2", function(d) { return d.x2; })
            .attr("y2", function(d) { return d.y2; })
            .attr("stroke", dataObj._regressionStrokeStyle)
            .style("opacity", 1e-6);

        if (enable) {
            regress_lines_enter = regress_lines_enter.transition()
                .duration(dr);
        }

        regress_lines_enter.style("opacity", 1.0);

        var regress_lines_exit = regress_lines.exit();

        if (enable) {
             regress_lines_exit = regress_lines.exit().transition()
                .duration(dr)
                .style("opacity", 1e-6);
        }

        regress_lines_exit.remove();
    }
};

vq.ScatterPlot.prototype.setDefaultSymbolStyle = function(selection) {
    var dataObj = this.data;
    selection
        .style("fill", dataObj._fillStyle)
        .style("stroke", dataObj._strokeStyle)
        .style("stroke-width", dataObj._strokeWidth)
        .style("opacity", 1.0);
};

vq.ScatterPlot.prototype.resetData = function(d) {
    this.data.data = d;

    var scales = this.getScales(this.data.data);
    this.regressData = this.getRegressData(scales);

    this.data_area.select("g.plot_brush").remove();

    this.updateScales(scales, false);
};

vq.ScatterPlot.prototype.removeListeners = function() {
    this.data_rect
        .on("mousedown.zoom", null)
        .on("mousewheel.zoom", null)
        .on("mousemove.zoom", null)
        .on("DOMMouseScroll.zoom", null)
        .on("dblclick.zoom", null)
        .on("touchstart.zoom", null)
        .on("touchmove.zoom", null)
        .on("touchend.zoom", null);
};

vq.ScatterPlot.prototype.enableZoom = function() {
    var that = this;
    this.removeListeners();

    this.data_area.select("g.plot_brush").remove();

    this.data_area.select("svg.symbols").selectAll("circle")
        .attr("class", "fg")
        .call(_.bind(this.setDefaultSymbolStyle, this));

    this.data_rect.call(d3.behavior.zoom().x(this.xScale).y(this.yScale).on("zoom", function(){
        _.bind(that.updateScales, that, {x: that.xScale, y: that.yScale}, true)();
    }));
};

vq.ScatterPlot.prototype.enableBrush = function() {
    this.removeListeners();

    this.data_area.selectAll("g.plot_brush")
        .remove();

    var brush_layer = this.data_area.append("g")
        .attr("class", "plot_brush");

    this.brush.clear();

    this.brush
        .x(this.xScale)
        .y(this.yScale)
        .on("brush", _.bind(this.brushHandler, this))
        .on("brushend", _.bind(this.brushEnd, this));

    brush_layer.call(this.brush);
};

vq.ScatterPlot.prototype.brushHandler = function() {
    var that = this;
    var e = this.brush.extent();
    var dataObj = this.data;

    var brushed = function(d) {
        return e[0][0] <= d[that.x] && d[that.x] <= e[1][0] && e[0][1] <= d[that.y] && d[that.y] <= e[1][1];
    };

    this.data_area.select("svg.symbols").selectAll("circle")
        .attr("class", function(d) {
            return brushed(d) ? "fg" : "bg";
        })
        .style("fill", function(d) {
            return brushed(d) ? dataObj._fillStyle() : dataObj._unselectedStrokeStyle();
        })
        .style("stroke", function(d) {
            return brushed(d) ? dataObj._strokeStyle() : dataObj._unselectedStrokeStyle();
        })
        .style("stroke-width", dataObj._strokeWidth)
        .style("opacity", function(d) {
            return brushed(d) ? 1.0 : 0.5;
        });
};

vq.ScatterPlot.prototype.brushEnd = function() {
    var that = this;
    var e = this.brush.extent();
    var dataObj = this.data;
    var handler = dataObj._brushHandler;

    if (this.brush.empty()) {
        this.data_area.select("svg.symbols").selectAll("circle")
            .attr("class", "fg")
            .call(_.bind(this.setDefaultSymbolStyle, this));

        this.data_area.selectAll("g.plot_brush")
            .remove();
    }

    (
        this.data_area.select("svg.symbols").selectAll("circle")
            .call(function(symbols) {
                var selected =
                    _.chain(symbols[0])
                        .map(function(s) { return s.__data__; })
                        .filter(function(d) {
                            return e[0][0] <= d[that.x] && d[that.x] <= e[1][0] && e[0][1] <= d[that.y] && d[that.y] <= e[1][1];
                        })
                        .value();

                if (selected.length > 0) {
                    handler(selected);
                }
            })
    )
};

vq.models.ScatterPlotData = function(data) {
    vq.models.VisData.call(this, data);
    this.setDataModel();
    if (this.getDataType() == 'vq.models.ScatterPlotData') {
        this._build_data(this.getContents());
    } else {
        console.warn('Unrecognized JSON object. Expected vq.models.ScatterPlotData object.');
    }
};

vq.models.ScatterPlotData.prototype = vq.extend(vq.models.VisData);

vq.models.ScatterPlotData.prototype.setDataModel = function () {
    this._dataModel = [
        {label: '_plot.width', id: 'PLOT.width', cast : Number, defaultValue: 512},
        {label: '_plot.height', id: 'PLOT.height', cast : Number, defaultValue: 512},
        {label: '_plot.container', id:'PLOT.container', optional : true},
        {label: 'xTickDisplacement', id: 'PLOT.x_tick_displacement', cast : Number, defaultValue: 15},
        {label: 'yTickDisplacement', id: 'PLOT.y_tick_displacement', cast : Number, defaultValue: -10},
        {label: 'xLabelDisplacement', id: 'PLOT.x_label_displacement', cast : Number, defaultValue: 30},
        {label: 'yLabelDisplacement', id: 'PLOT.y_label_displacement', cast : Number, defaultValue: -50},
        {label:  'vertical_padding', id: 'PLOT.vertical_padding', cast : Number, defaultValue: 40},
        {label:  'horizontal_padding', id: 'PLOT.horizontal_padding',cast : Number,  defaultValue:60},
        {label: 'enableTransitions', id: 'PLOT.enable_transitions', cast : Boolean, defaultValue: false},
        {label: 'transitionDuration', id: 'PLOT.transition_duration', cast : Number, defaultValue: 1000.0},
        {label : 'data', id: 'data_array', defaultValue : [] },
        {label : 'COLUMNID.x', id: 'xcolumnid',cast : String, defaultValue : 'X'},
        {label : 'COLUMNID.y', id: 'ycolumnid',cast : String, defaultValue : 'Y'},
        {label : 'COLUMNID.value', id: 'valuecolumnid',cast : String, defaultValue : 'VALUE'},
        {label : 'COLUMNLABEL.x', id: 'xcolumnlabel',cast : String, defaultValue : ''},
        {label : 'COLUMNLABEL.y', id: 'ycolumnlabel',cast : String, defaultValue : ''},
        {label : 'COLUMNLABEL.value', id: 'valuecolumnlabel',cast : String, defaultValue : ''},
        {label : 'tooltipItems', id: 'tooltip_items', defaultValue : {
            X : 'X', Y : 'Y', Value : 'VALUE'            }  },
        {label : '_fillStyle', id: 'fill_style',cast :vq.utils.VisUtils.wrapProperty,
            defaultValue : function() {
                return 'rgba(70,130,180,0.2)';
        }},
        {label : '_strokeStyle', id: 'stroke_style',
            cast :vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'steelblue';
        }},
        {label : '_unselectedStrokeStyle', id: 'unselected_stroke_style',
            cast :vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'lightgray';
        }},
        {label : '_strokeWidth', id: 'stroke_width',cast :vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 2;
        }},
        {label : '_regressionStrokeStyle', id: 'regression_stroke_style',
            cast :vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'green';
        }},
        {label : '_radius', id: 'radius',cast :vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 2;
        }},
        {label : '_shape', id: 'shape',cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'dot';
        }},
        {label : '_axisFont', id: 'axis_font',cast :vq.utils.VisUtils.wrapProperty,
            defaultValue : function() {
                return '14px helvetica';
        }},
        {label : '_tickFont', id: 'tick_font',cast :vq.utils.VisUtils.wrapProperty,
            defaultValue : function() {
                return '14px helvetica';
        }},
        {label : '_regression', id: 'regression',cast :String, defaultValue : 'none'},
        {label : '_notifier', id: 'notifier', cast : Function, defaultValue : function() {
            return null;
        }},
        {label : '_brushHandler', id: 'brush_handler', cast : Function, defaultValue : function() {
             return null;
        }}
    ];
};

vq.models.ScatterPlotData.prototype._build_data = function(data) {
    this._processData(data);

    if (this.COLUMNLABEL.x == '') this.COLUMNLABEL.x = this.COLUMNID.x;
    if (this.COLUMNLABEL.y == '') this.COLUMNLABEL.y = this.COLUMNID.y;
    if (this.COLUMNLABEL.value == '') this.COLUMNLABEL.value = this.COLUMNID.value;

    if (this.data.length > 0) this.setDataReady(true);
};
(function($) {
    var methods = {
      init : function( options ) {
          return this.each(function() {
              var $this = $(this);
              var vis = $(this).data("visquick.d3.scatterplot");
              if (!vis) {
                  options.CONTENTS.PLOT.container = $this.get(0);
                  $this.data("visquick.d3.scatterplot", (vis = new vq.ScatterPlot()));
                  vis.draw(options);
              }
          });
      },
      reset_data : function(data_array) {
          return this.each(function() {
              var vis = $(this).data("visquick.d3.scatterplot");
              if (vis) {
                  vis.resetData(data_array);
              }
          });
      },
      enable_zoom : function() {
          return this.each(function() {
              var vis = $(this).data("visquick.d3.scatterplot");
              if (vis) {
                  vis.enableZoom();
              }
          });
      },
      enable_brush : function() {
          return this.each(function() {
              var vis = $(this).data("visquick.d3.scatterplot");
              if (vis) {
                  vis.enableBrush();
              }
          });
      }
    };

    $.fn.scatterplot = function( method ) {
      // Method calling logic
      if ( methods[method] ){
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
      }
      else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
      }
      else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.scatterplot' );
      }
    };
})(window.jQuery);
