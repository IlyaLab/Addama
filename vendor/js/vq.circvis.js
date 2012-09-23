//circvis.wedge.js


vq.CircVis = function() {
    vq.Vis.call(this);
};
vq.CircVis.prototype = vq.extend(vq.Vis);

/**
 *
 *  Constructs the Circvis model and adds the SVG tags to the defined DOM element.
 *
 * @param {JSON Object} circvis_object - the object defined above.
 */
vq.CircVis.prototype.draw = function(data) {

    var vis_data = new vq.models.CircVisData(data);

    if (vis_data.isDataReady()) {
        this.chromoData = vis_data;
        this._render();
    } else {
        console.warn('Invalid data input.  Check data for missing or improperly formatted values.');
    }
};

vq.CircVis.prototype._render = function() {

    var that = this;

    var dataObj = this.chromoData;
    var width = dataObj._plot.width, height = dataObj._plot.height;

    function dragmove(d,u) {
        var transform = d3.transform(d3.select(this).attr('transform'));
        var translate = transform.translate;
        var scale = transform.scale;
        var rotation = transform.rotate;
        var actual_width = (width /2*scale[0]), actual_height = (height /2*scale[1]);
        var p = [d3.event.x - actual_width, d3.event.y -actual_height];
        var q = [d3.event.x - d3.event.dx - actual_width, d3.event.y - d3.event.dy - actual_height];
        function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
        function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
        var angle = Math.atan2(cross(q,p),dot(q,p)) * 180 / Math.PI;
        rotation += angle;
        d3.select(this).attr('transform','translate(' + translate[0]+','+translate[1]+')scale('+scale+')rotate('+rotation+')');
    }


    function dragstart(d,u) {}
    function dragend(d,u) {}

    var drag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    var id = dataObj._plot.id;

    var svg = d3.select(dataObj._plot.container)        
        .append('svg:svg')
        .attr('id', id)
        .attr('width', width)
        .attr('height', height)
        .append('svg:g')
        .attr('class', 'circvis')
        .attr("transform", 'translate(' + width / 2 + ',' + height / 2 + ')')
        .call(drag);

        svg.insert('svg:defs');


var ideograms = svg.selectAll('g.ideogram')
        .data(dataObj._chrom.keys)
        .enter().append('svg:g')
            .attr('class','ideogram')
            .attr('data-region',function(d) { return d;})
            .attr('opacity',1.0)
            .attr('transform',function(key) { return 'rotate(' + dataObj._chrom.groups[key].startAngle * 180 / Math.PI + ')';})
            .each(draw_ideogram_rings);
//calculate label placement as halfway along tick radial segment
    var outerRadius  = (dataObj._plot.height / 2);
    var outerTickRadius = outerRadius - dataObj.ticks.outer_padding;
    var innerRadius = outerTickRadius - dataObj.ticks.height;
    var label_height = (outerTickRadius + innerRadius) / 2;

           ideograms.append('text')
            .attr('transform',function(key) { return 'rotate(' + (dataObj._chrom.groups[key].endAngle - dataObj._chrom.groups[key].startAngle)
                   * 180 / Math.PI / 2 +
                   ' )translate(0,-'+label_height+')';})
             .attr('class','region_label')
                           .attr('stroke','black')
                           .attr('text-anchor','middle')
                            .attr('dy','.35em')
               .attr('cursor','pointer')
            .text(function(f) { return f;})
               .each(function() { $(this).disableSelection();})
            .on('mouseover',function ideogram_label_click(obj){
                   var half_arc_genome = {};
                   var region_length = dataObj.normalizedLength[obj];
                   var new_length = 1.0 - region_length;
                   var num_regions = _.size(dataObj.normalizedLength);
                   _.each(dataObj.normalizedLength,function(value,key,list){
                        half_arc_genome[key] = value / new_length / 2;
                   });
                   half_arc_genome[obj] = 0.5;
               });
    if(!_.isNull(dataObj._chrom.radial_grid_line_width)&&
                dataObj._chrom.radial_grid_line_width > 0) {

        var network_radius = dataObj._network.network_radius;
                ideograms.selectAll('path.radial_lines')
                    .data(function(chr) {
                        return [[{x:0,y:-1*outerTickRadius},{x:0,y:-1*network_radius[chr]}]];
                    })
                    .enter().insert('svg:path','.wedges')
                    .attr('class','radial_lines')
                    .attr('d',d3.svg.line()
                    .x(function(point) {return point.x;})
                    .y(function(point) {return point.y;})
                    .interpolate('linear')
                    );
   }

        function draw_ideogram_rings(d) {
            that._add_wedge( d);
            that._drawTicks( d);
            that._drawNetworkNodes( d);
        }
    that._drawNetworkLinks(svg.insert('svg:g','.ideogram').attr('class','links'));
    _(_.range(0,dataObj._wedge.length)).each(function(ring_index) {
        that._draw_axes_ticklabels(ring_index);
        that._insertRingClipping(ring_index);
    });

};

vq.CircVis.prototype._drawWedgeContents = function(chr, wedge_index) {
    var that = this;
    var dataObj = that.chromoData;
    var ideogram = dataObj._ideograms[chr];
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');
    var wedge_params = dataObj._wedge[wedge_index];
    switch (wedge_params._plot_type) {
        case('karyotype'):
        case('tile'):
        case('band'):
        case('heatmap'):
        case('glyph'):
            this._drawWedgeData(chr, wedge_index);
            break;
        default:
            this._drawWedge_withRange(chr, wedge_index);
    }
};

vq.CircVis.prototype._insertRingClipping = function(index) {
    var outerRadius =  this.chromoData._wedge[index]._outerRadius,
    innerRadius = this.chromoData._wedge[index]._innerRadius;

    var arc = d3.svg.arc()({innerRadius:innerRadius,outerRadius:outerRadius, startAngle:0,endAngle:2*Math.PI});

    d3.select('svg .circvis defs').append('svg:clipPath')
        .attr('id','ring_clip_'+index)
        .append('svg:path')
        .attr('d',arc);
};

/**private **/
vq.CircVis.prototype._add_wedge = function(chr) {
    var that = this;
    var dataObj = this.chromoData;
    var ideogram_obj = d3.select('.ideogram[data-region="'+chr+'"]');

    function outerRadius(index) {
        return dataObj._wedge[index]._outerPlotRadius;
    }

    function innerRadius(index) {
        return dataObj._wedge[index]._innerRadius;
    }

    var wedge_obj = ideogram_obj.append("svg:g")
        .attr('class','wedges')
        .selectAll("path")
        .data(_.range(0,dataObj._wedge.length))
        .enter()
        .append("svg:g")
        .attr("class",  "wedge")
        .attr("clip-path",function(index) { return "url(#ring_clip_" + index + ")";})
        .attr('data-ring',function(index) { return index;});

    wedge_obj
        .append("svg:path")
        .attr('class', 'background')
        .attr("d",d3.svg.arc()
        .innerRadius(  function(ring_index) { return innerRadius(ring_index); })
        .outerRadius( function(ring_index) { return outerRadius(ring_index);} )
        .startAngle(0)
        .endAngle( dataObj._chrom.groups[chr].angle)
    );


    wedge_obj.append("svg:g")
        .attr('class','data');

    ideogram_obj.selectAll("g.wedge")
        .each(checkAndPlot);

    function checkAndPlot(wedge_index) {
        var wedge_obj = d3.select(this);
        var wedge_params = dataObj._wedge[wedge_index];
        if ((wedge_params._plot_type != 'karyotype') &&
            (wedge_params._plot_type != 'tile') &&
            (wedge_params._plot_type != 'band') &&
            (wedge_params._plot_type != 'glyph')) {
            if (isNaN(wedge_params._min_plotValue) || isNaN(wedge_params._max_plotValue)) {
                console.warn('Range of values for ring with index (' + wedge_index + ') not detected.  Data has not been plotted.');
                return;
            }
            else if (wedge_params._min_plotValue == wedge_params._max_plotValue) {
                wedge_params._min_plotValue = wedge_params._min_plotValue - 1;
                wedge_params._max_plotValue = wedge_params._max_plotValue + 1;
                console.warn('Invalid value range detected.  Range reset to [-1,1].');
            }
        }
        that._drawWedgeContents(chr, wedge_index);
    }
};


vq.CircVis.prototype._drawWedge_withoutRange = function( chr, wedge_index) {
    var that = this;
    var dataObj = that.chromoData;
    var ideogram = dataObj._ideograms[chr];
    var wedge_params = dataObj._wedge[wedge_index];
    var wedge = ideogram.wedge[wedge_index];
};

vq.CircVis.prototype._drawWedge_withRange = function(chr, wedge_index) {
    var that = this;
    var dataObj = that.chromoData;
    var ideogram = dataObj._ideograms[chr];
    var wedge_params = dataObj._wedge[wedge_index];
    var wedge = ideogram.wedge[wedge_index];
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');

    if (wedge_params._draw_axes) {
        /* Circular grid lines. */
        //add a new panel each time we want to draw on top of the previously created image.
        var p = dataObj._chrom.groups[chr];
        var startAngle = p.startAngle;
        var endAngle = p.angle;

        // generate ticks for y_axis
        var radii = wedge_params._y_linear.ticks(4);
          wedge_obj.append("svg:g")
            .attr('class','axes')
            .selectAll("path")
            .data(radii)
            .enter().append("svg:path")
            .style("fill", "#ddd")
            .style("stroke", "#555")
            .style('stroke-width', '1.0px')
            .attr('d',d3.svg.arc()
                .innerRadius(function(d) { return wedge_params._y_linear(d);})
                .outerRadius(function(d) { return wedge_params._y_linear(d);})
                .startAngle(0)
                .endAngle(endAngle)
        ); 
    }


    that._drawWedgeData(chr, wedge_index);

};

vq.CircVis.prototype._drawWedgeData = function(chr, wedge_index) {
    var that = this;

    //draw all wedges if parameter is left out.
    var all_wedges = _.isUndefined(wedge_index) || _.isNull(wedge_index);
    //return if ill-defined wedge
    if (!all_wedges && _.isNumber(wedge_index) && _.isFinite(wedge_index) &&
        wedge_index >= that.chromoData._wedge.length) {
        console.error('drawWedgeData: Invalid wedge #:' + wedge_index);
        return;
    }

    function drawWedge(index) {
        var wedge_params = that.chromoData._wedge[index];

        var funcName = '_drawWedgeData_'+ wedge_params._plot_type;
        if (that[funcName] !==undefined) {
            that[funcName](chr,index);
        }
        //get all the data points in this wedge
        var data = d3.selectAll('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+index+'"] .data > *');
        //set listener
        data.on('mouseover',function(d) { wedge_params.hovercard.call(this,d);});
    }

    if (all_wedges) {
        _.each(_.range(0,that.chromoData._wedge.length),function(i) { drawWedge.call(that,i);});
        return;
    }
    else {
        drawWedge.call(that,wedge_index);
    }

};


vq.CircVis.prototype._drawWedgeData_barchart = function(chr, wedge_index) {
    var that = this;
    var wedge_params = that.chromoData._wedge[wedge_index];
    var wedge_data = that.chromoData._ideograms[chr].wedge[wedge_index];
    var value_key = wedge_params._value_key;
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');

    var histogramArc = function (point) {
        var _inner = wedge_params._innerRadius;
        var start = that.chromoData._ideograms[chr].theta(point.start);
        var end = that.chromoData._ideograms[chr].theta(point.end);
        return d3.svg.arc()
            .innerRadius( _inner)
            .startAngle( start)
            .endAngle(end);
    };

    var hist = wedge_obj.select('g.data')
        .selectAll("path")
        .data(wedge_data,that.chromoData._network.node_key);
    hist
        .enter().append('svg:path')
        .style('fill',wedge_params._fillStyle)
        .style('stroke',wedge_params._strokeStyle)
        .style('stroke-width',wedge_params._lineWidth)
        .style('fill-opacity',1e-6)
        .style('stroke-opacity',1e-6)
        .transition()
        
        .duration(800)
        .attrTween('d',function(a) {
            var i =d3.interpolate({outerRadius:wedge_params._innerRadius},{outerRadius:wedge_params._thresholded_outerRadius(a[value_key])});
            var arc = histogramArc(a);
            return function(t) {return arc(i(t));};
        })
        .style('fill-opacity', 1.0)
        .style('stroke-opacity', 1.0);

    hist.exit()
        .transition()
        .duration(800)
        .attrTween('d',function(a) {
            var i =d3.interpolate({outerRadius:wedge_params._thresholded_outerRadius(a[value_key])},{outerRadius:wedge_params._innerRadius});
            var arc = histogramArc(a);
            return function(t) {return arc(i(t));};
        })
        .style('fill-opacity',1e-6)
        .style('stroke-opacity',1e-6)
        .remove();
};

vq.CircVis.prototype._drawWedgeData_histogram = vq.CircVis.prototype._drawWedgeData_barchart;

vq.CircVis.prototype._drawWedgeData_scatterplot = function(chr, wedge_index) {
    var that = this;
    var wedge_params = that.chromoData._wedge[wedge_index];
    var wedge_data = that.chromoData._ideograms[chr].wedge[wedge_index];
    var value_key = wedge_params._value_key;
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');

    var scatter = wedge_obj.select('g.data')
        .selectAll("path")
        .data(wedge_data,that.chromoData._network.node_key);
    scatter
        .enter().append('svg:path')
        .style('fill',wedge_params._fillStyle)
        .style('stroke',wedge_params._strokeStyle)
        .style('fill-opacity', 1e-6)
        .style('stroke-opacity', 1e-6)
        .attr("transform",function(point) {
            return "rotate(" + ((that.chromoData._ideograms[chr].theta(point.start) * 180 / Math.PI) - 90)+ ")translate(" +
                wedge_params._thresholded_value_to_radius(point[value_key]) + ")";} )
        .attr('d',d3.svg.symbol()
            .type(wedge_params._shape)
            .size(Math.pow(wedge_params._radius(),2)) )
        .transition()
        .duration(800)
        .style('fill-opacity', 1)
        .style('stroke-opacity', 1);

    scatter.exit()
        .transition()
        .duration(800)
        .style('fill-opacity', 1e-6)
        .style('stroke-opacity', 1e-6)
        .remove();
};

vq.CircVis.prototype._drawWedgeData_line = function(chr, wedge_index) {
    var that = this;
    var wedge_params = that.chromoData._wedge[wedge_index];
    var wedge_data = _.sortBy(that.chromoData._ideograms[chr].wedge[wedge_index],'start');
    var value_key = wedge_params._value_key;
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');

    var line = d3.svg.line.radial()
            .interpolate('basis')
            .tension(0.8)
            .radius(function(point) { return wedge_params._thresholded_value_to_radius(point[value_key]);})
            .angle(function(point) { return that.chromoData._ideograms[chr].theta(point.start);});

    var line_plot = wedge_obj.select('g.data')
        .selectAll("path")
        .data([wedge_data]);
    line_plot
        .enter().append('svg:path')
        .style('fill',wedge_params._fillStyle)
        .style('stroke',wedge_params._strokeStyle)
        .style('fill-opacity', 1e-6) //leave opacity at 0
        .style('stroke-opacity', 1e-6)
        .attr('d',line)
        .transition()
        .duration(800)
        .style('stroke-opacity', 1);

    line_plot.exit()
        .transition()
        .duration(800)
        .style('fill-opacity', 1e-6)
        .style('stroke-opacity', 1e-6)
        .remove();
};

vq.CircVis.prototype._drawWedgeData_area = function(chr, wedge_index) {
    var that = this;
    var wedge_params = that.chromoData._wedge[wedge_index];
    var wedge_data = _.sortBy(that.chromoData._ideograms[chr].wedge[wedge_index],'start');
    var value_key = wedge_params._value_key;
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');

    var line = d3.svg.line.radial()
            .interpolate('basis')
            .tension(0.8)
            .radius(function(point) { return wedge_params._thresholded_value_to_radius(point[value_key]);})
            .angle(function(point) { return that.chromoData._ideograms[chr].theta(point.start);});


    var area = d3.svg.area.radial()
            .interpolate('basis')
            .tension(0.8)
            .innerRadius(function(point) { return  wedge_params._thresholded_innerRadius(point[value_key]);})
            .outerRadius(function(point) { return wedge_params._thresholded_outerRadius(point[value_key]);})
            .angle(function(point) { return that.chromoData._ideograms[chr].theta(point.start);});


    var line_plot = wedge_obj.select('g.data')
        .selectAll("path")
        .data([wedge_data]);
    line_plot
        .enter().append('svg:path')
        .style('fill',wedge_params._fillStyle)
        .style('stroke',wedge_params._strokeStyle)
        .style('fill-opacity', 1e-6) //leave opacity at 0
        .style('stroke-opacity', 1e-6)
        .attr('d',line)
        .transition()
        .duration(800)
        .style('stroke-opacity', 1);

        line_plot
        .enter().append('svg:path')
        .style('fill',wedge_params._fillStyle)
        .style('stroke',wedge_params._strokeStyle)
        .style('fill-opacity', 1e-6) 
        .style('stroke-opacity', 1e-6)//leave opacity at 0
        .attr('d',area)
        .transition()
        .duration(800)
        .style('fill-opacity', 0.7);

    line_plot.exit()
        .transition()
        .duration(800)
        .style('fill-opacity', 1e-6)
        .style('stroke-opacity', 1e-6)
        .remove();
};

vq.CircVis.prototype._drawWedgeData_band = function(chr, wedge_index) {
    var that = this;
    var wedge_params = that.chromoData._wedge[wedge_index];
    var wedge_data = that.chromoData._ideograms[chr].wedge[wedge_index];
    var value_key = wedge_params._value_key;

    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');
    var band = wedge_obj.select('g.data')
        .selectAll("path")
        .data(wedge_data,that.chromoData._network.node_key);
    band
        .enter().append('svg:path')
        .style('fill',wedge_params._fillStyle)
        .style('stroke',wedge_params._strokeStyle)
        .style('fill-opacity', 1e-6)
        .style('stroke-opacity', 1e-6)
        .attr('d',d3.svg.arc()
        .innerRadius( wedge_params._innerRadius)
        .outerRadius( wedge_params._outerPlotRadius)
        .startAngle(function(point) { return that.chromoData._ideograms[chr].theta(point.start);})
        .endAngle(function(point) { return that.chromoData._ideograms[chr].theta(point.end);})
    )
        .transition()
        
        .duration(800)
        .style('fill-opacity', 1)
        .style('stroke-opacity', 1);

    band
        .exit()
        .transition()
        
        .duration(800)
        .style('fill-opacity', 1e-6)
        .style('stroke-opacity', 1e-6)
        .remove();
};

vq.CircVis.prototype._drawWedgeData_glyph = function(chr, wedge_index) {

    var that = this;
    var wedge_params = that.chromoData._wedge[wedge_index];
    var wedge_data = that.chromoData._ideograms[chr].wedge[wedge_index];
    var value_key = wedge_params._value_key;
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');

    var glyph = wedge_obj.select('g.data')
        .selectAll("path")
        .data(wedge_data,wedge_params._hash);
    glyph
        .enter().append('svg:path')
        .style('fill',wedge_params._fillStyle)
        .style('stroke',wedge_params._strokeStyle)
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .attr("transform",function(point) {
            return "rotate(" + ((that.chromoData._ideograms[chr].theta(point.start) * 180 / Math.PI) - 90)+ ")translate(" +
                wedge_params._glyph_distance(point) + ")";} )
        .transition()
        
        .duration(800)
        .attr('d',d3.svg.symbol()
        .type(wedge_params._shape)
        .size(Math.pow(wedge_params._radius(),2))
    )
        .transition()
        
        .duration(800)
        .style('fill-opacity', 1)
        .style('stroke-opacity', 1);
    glyph.exit()
        .transition()
        
        .duration(800)
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .remove();
};

vq.CircVis.prototype._drawWedgeData_tile = function(chr, wedge_index) {
    var that = this;
    var wedge_params = that.chromoData._wedge[wedge_index];
    var wedge_data = that.chromoData._ideograms[chr].wedge[wedge_index];
    var value_key = wedge_params._value_key;
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');

    var tile = wedge_obj.select('g.data')
        .selectAll("path")
        .data(wedge_data,that.chromoData._network.node_key);
    tile
        .enter().append('svg:path')
        .style('fill',wedge_params._fillStyle)
        .style('stroke',wedge_params._strokeStyle)
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .attr('d',d3.svg.arc()
        .innerRadius( function(point) { return wedge_params._thresholded_tile_innerRadius(point,wedge_params);})
        .outerRadius( function(point) { return wedge_params._thresholded_tile_outerRadius(point,wedge_params);})
        .startAngle(function(point) { return that.chromoData._ideograms[chr].theta(point.start);})
        .endAngle(function(point) { return that.chromoData._ideograms[chr].theta(point.end);})
    ) .transition()
        
        .duration(800)
        .style('fill-opacity', 1)
        .style('stroke-opacity', 1);

    tile.exit()
        .transition()
        
        .duration(800)
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .remove();
};

vq.CircVis.prototype._drawWedgeData_karyotype = function(chr, wedge_index) {
    var that = this;
    var wedge_params = that.chromoData._wedge[wedge_index];
    var wedge_data = that.chromoData._ideograms[chr].wedge[wedge_index];
    var value_key = wedge_params._value_key;
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');
    var karyotype = wedge_obj.select('g.data')
        .selectAll("path")
        .data(wedge_data,that.chromoData._network.node_key);
    karyotype
        .enter().append('svg:path')
        .style('fill',function(point) { return point[value_key];})
        .style('stroke',wedge_params._strokeStyle)
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .attr('d',d3.svg.arc()
        .innerRadius( wedge_params._innerRadius)
        .outerRadius( wedge_params._outerPlotRadius)
        .startAngle(function(point) { return that.chromoData._ideograms[chr].theta(point.start);})
        .endAngle(function(point) { return that.chromoData._ideograms[chr].theta(point.end);})
    )
        .transition()     
        .duration(800)
        .style('fill-opacity', 1)
        .style('stroke-opacity', 1);

    karyotype.exit()
        .transition()
        
        .duration(800)
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .remove();
};

vq.CircVis.prototype._drawWedgeData_heatmap = function(chr, wedge_index) {
    var that = this;
    var wedge_params = that.chromoData._wedge[wedge_index];
    var wedge_data = that.chromoData._ideograms[chr].wedge[wedge_index];
    var value_key = wedge_params._value_key;
    var wedge_obj = d3.select('.ideogram[data-region="'+chr+'"] .wedge[data-ring="'+wedge_index+'"]');

    var generateArcTween = function (point) {
        var _theta = that.chromoData._ideograms[chr].theta(point.start);
        var _end = that.chromoData._ideograms[chr].theta(point.end);
        return d3.svg.arc()
            .innerRadius(function(multiplier) { return wedge_params._innerRadius - (multiplier *4);})
            .outerRadius(function(multiplier) { return wedge_params._outerPlotRadius + (multiplier * 4);})
            .startAngle(function(multiplier) { return _theta -  (multiplier * Math.PI / 360);})
            .endAngle(function(multiplier) {  return _end + (multiplier * Math.PI /  360);});
    };

    var heat = wedge_obj.select('g.data')
        .selectAll("path")
        .data(wedge_data,that.chromoData._network.node_key);
    heat
        .enter().append('svg:path')
        .style('fill',wedge_params._fillStyle)
        .style('stroke',wedge_params._strokeStyle)
        .style('stroke-width','1px')
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .attr('d',d3.svg.arc()
        .innerRadius( wedge_params._innerRadius)
        .outerRadius( wedge_params._outerPlotRadius)
        .startAngle(function(point) { return that.chromoData._ideograms[chr].theta(point.start);})
        .endAngle(function(point) { return that.chromoData._ideograms[chr].theta(point.end);})
    )
        .transition()
        
        .duration(800)
        .transition()
        
        .duration(800)
        .style('fill-opacity', 1)
        .style('stroke-opacity', 1)
        .attrTween('d',function(a) {
            var i =d3.interpolate(4,0);
            var arc = generateArcTween(a);
            return function(t) {return arc(i(t));};
        });

    heat.exit()
        .transition()
        .duration(800)
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .remove();

};

vq.CircVis.prototype._draw_axes_ticklabels = function(wedge_index) {
    var that = this;
    var dataObj = that.chromoData;
    var wedge_params = dataObj._wedge[wedge_index];
    //don't do this for ring without a range.
    if(!_.isFunction(wedge_params._y_linear)) { return;}

    if (wedge_params._draw_axes) {
        /* Circular grid lines. */

        // generate ticks for y_axis
        var radii = wedge_params._y_linear.ticks(4);

        d3.select('.ideogram .wedge[data-ring="'+wedge_index+'"] .axes')
            .append("svg:g")
            .attr('class','labels')
            .selectAll('g.text')
            .data(radii)
            .enter().append("svg:text")
            .each(function() {$(this).disableSelection();})
            .attr('transform',function(r) {return 'translate(0,-'+wedge_params._y_linear(r) +')';})
            .text(function(a) { return a;});
    }

};


/** private **/
vq.CircVis.prototype._drawTicks = function(chr) {
    var that = this;
    var dataObj = that.chromoData;

    if(!dataObj.ticks.render_ticks) { return;}

    var ideogram_obj = d3.select('.ideogram[data-region="'+chr+'"]');
    
    var outerRadius  = (dataObj._plot.height / 2);
    var outerTickRadius = outerRadius - dataObj.ticks.outer_padding;
    var innerRadius = outerTickRadius - dataObj.ticks.height;
    var inner = dataObj.ticks.tile_ticks ?  function(feature) {
        return innerRadius +
            (feature.level * (dataObj.ticks.wedge_height * 1.3)) ;} :
        function(feature) { return innerRadius;};

    var outer = function(feature) { return inner(feature) + dataObj.ticks.wedge_height;};
    var label_key = dataObj.ticks.label_key;

    var tick_fill = function(c) { return dataObj.ticks.fill_style(c,label_key);};
    var tick_stroke = function(c) { return dataObj.ticks.stroke_style(c,label_key);};
    var tick_angle = function(tick) { var angle = tick_length / inner(tick); return  isNodeActive(tick) ? angle * 2 : angle; };
    var isNodeActive = function(c) { return true;};

    var tick_width = Math.PI / 180 * dataObj.ticks.wedge_width;
    var tick_length = tick_width * innerRadius;

    var generateArcTween = function (point) {
        var _inner = inner(point);
        var _outer = outer(point);
        var _theta = that.chromoData._ideograms[point.chr].theta(point.start);
        var _tick_angle = tick_angle(point);
        return d3.svg.arc()
            .innerRadius(function(multiplier) { return _inner - (multiplier *4);})
            .outerRadius(function(multiplier) { return _outer + (multiplier * 4);})
            .startAngle(function(multiplier) { return _theta -  (multiplier * Math.PI / 360);})
            .endAngle(function(multiplier) {
                return _theta + _tick_angle + (multiplier * Math.PI /  360);});
    };

    var tick_key = dataObj._network.node_key;

    if(ideogram_obj.select('g.ticks').empty()) {
        ideogram_obj
            .append('svg:g')
            .attr('class','ticks');
    }

    var ticks = ideogram_obj.select('g.ticks').selectAll('path')
        .data(dataObj.ticks.data_map[chr],tick_key);

    ticks.enter().append('path')
        .attr('class',function(tick) { return tick[label_key];})
        .style('fill',tick_fill)
        .style('stroke',tick_stroke)
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .on('mouseover',function(d){
            d3.select('text[data-label=\''+d[label_key]+'\']').attr('visibility','visible');
            dataObj.ticks.hovercard.call(this,d);
        })
        .on('mouseout',function(d){
            d3.select('text[data-label=\''+d[label_key]+'\']').attr('visibility','hidden');
        })
        .transition()
        .duration(800)
        .attrTween('d',function(a) {
            var i =d3.interpolate(4,0);
            var arc = generateArcTween(a);
            return function(t) {return arc(i(t));};
        })
        .style('fill-opacity', 1)
        .style('stroke-opacity', 1);

    ticks.exit()
        .transition()
        .duration(800)
        .attrTween('d',function(a) {
            var i =d3.interpolate(0,4);
            var arc = generateArcTween(a);
            return function(t) {return arc(i(t));};
        })
        .style('fill-opacity', 1e-6)
                .style('stroke-opacity', 1e-6)
        .remove();

};


/** private **/
vq.CircVis.prototype._drawNetworkNodes = function (chr) {
    var     dataObj = this.chromoData;

    var network_radius = dataObj._network.tile_nodes ? function(node) { return dataObj._network.network_radius[chr] - (node.level * 2 * dataObj._network.node_radius(node)); } :
    function(node) { return dataObj._network.network_radius[chr];};

    var ideogram_obj = d3.select('.ideogram[data-region="'+chr+'"]');

    if(ideogram_obj.select('g.nodes').empty()) {
        ideogram_obj.append('svg:g').attr('class','nodes');
    }
    var arr = dataObj._network.nodes_array.filter(function(node) { return !node.children && node.chr == chr;});

    var node = ideogram_obj
        .select('g.nodes')
        .selectAll('circle.node')
        .data(dataObj._network.nodes_array.filter(function(node) { return !node.children && node.chr == chr;}),dataObj._network.node_key);

    var node_enter = node.enter(),
        node_exit = node.exit();

    node_enter.append('svg:circle')
        .attr('class','node')
        .attr('cx',0)
        .attr('cy',0)
        .attr('r',function(a) { return dataObj._network.node_radius(a)*4; })
        .style('fill',dataObj._network.node_fillStyle)
        .style('stroke',dataObj._network.node_strokeStyle)
        .style('fill-opacity',1e-6)
        .style('stroke-opacity',1e-6)
        .attr('transform', function(node) {
            return 'rotate('+ ((dataObj._ideograms[chr].theta(node.start) / Math.PI * 180) - 90) +')translate(' + network_radius(node) + ')';
        })
        .on('mouseover',function(d){dataObj._network.node_hovercard.call(this,d);})
        .transition()
        .duration(800)
        .attr('r',dataObj._network.node_radius)
        .style('stroke-opacity',1)
        .style('fill-opacity',1);

    node_exit
    .transition()
        .duration(800)
        .attr('r',function(a) {return dataObj._network.node_radius(a)*4; })
        .style('fill-opacity',1e-6)
                .style('stroke-opacity',1e-6)
       .remove();
};

vq.CircVis.prototype._drawNetworkLinks= function() {

    var dataObj = this.chromoData;

    var bundle = d3.layout.bundle();

    var network_radius = dataObj._network.tile_nodes ? function(node) { return dataObj._network.network_radius[node.chr] - (node.level * 2 * dataObj._network.node_radius(node)); } :
        function(node) { return dataObj._network.network_radius[node.chr];};

    var line = d3.svg.line.radial()
        .interpolate("bundle")
        .tension(.65)
        .radius(function(d) { return d.radius !== undefined ?
            d.radius :
            network_radius(d)
        })
        .angle(function(d) { return d.angle !== undefined ?
            d.angle :
            dataObj._ideograms[d.chr]._feature_angle(d.start);
        });

    var edges = d3.select('g.links').selectAll("path.link")
        .data(bundle(dataObj._network.links_array).map(function(b, index) { return _.extend(dataObj._network.links_array[index],{spline:b});}));

        edges
        .enter().insert("svg:path")
        .attr("class", function(d) {
            return "link t_" + d.source.chr + " p_"+ d.target.chr;
        })

        .style('fill','none')
        .style('stroke',dataObj._network.link_strokeStyle)
        .style('stroke-width',function(a) { return dataObj._network.link_line_width(a) * 3;})
        .style('stroke-opacity',1e-6)
        .attr("d", function(link) { return line(link.spline);})
        .on('mouseover',function(d){
            d3.select(this).style('stroke-opacity',1.0); dataObj._network.link_hovercard.call(this,d);
        })
        .on('mouseout',function(d){d3.select(this).style('stroke-opacity',dataObj._network.link_alpha(d));})
        .transition()
        .duration(800)
        .style('stroke-width',dataObj._network.link_line_width)
        .style('stroke-opacity',dataObj._network.link_alpha);

        edges.exit()
        .transition()
        .duration(800)
         .style('stroke-opacity',1e-6)
         .style('stroke-width',function(a) { return dataObj._network.link_line_width(a)*3;})
        .remove();
};



vq.models.CircVisData = function(data) {

    vq.models.VisData.call(this, data);

    this.setDataModel();

    if (this.getDataType() == 'vq.models.CircVisData') {
        this._build_data(this.getContents())
    } else {
        console.warn('Unrecognized JSON object.  Expected vq.models.CircVisData object.');
    }
};


vq.models.CircVisData.prototype = vq.extend(vq.models.VisData);

vq.models.CircVisData.prototype.setDataModel = function() {
    this._dataModel = [
        {label: '_plot.width', id: 'PLOT.width', defaultValue: 400},
        {label: '_plot.height', id: 'PLOT.height', defaultValue: 400},
        {label : '_plot.container', id:'PLOT.container', optional : true},
        {label: 'vertical_padding', id: 'PLOT.vertical_padding', defaultValue: 0},
        {label: 'horizontal_padding', id: 'PLOT.horizontal_padding', defaultValue: 0},
        {label : '_chrom.keys', id: 'GENOME.DATA.key_order', defaultValue : ["1","2","3","4","5","6","7","8","9","10",
            "11","12","13","14","15","16","17","18","19","20","21","22","X","Y"] },
        {label : '_chrom.length', id: 'GENOME.DATA.key_length', defaultValue : [] },
        {label : '_chrom.reverse_list', id: 'GENOME.OPTIONS.key_reverse_list', optional : true },
        {label : '_chrom.gap_degrees', id: 'GENOME.OPTIONS.gap_degrees', cast : Number, defaultValue : 0 },
        {label : '_chrom.label_layout_style', id: 'GENOME.OPTIONS.label_layout_style', defaultValue : 'default' },
        {label : '_chrom.label_font_style', id: 'GENOME.OPTIONS.label_font_style', cast: String, defaultValue : "16px helvetica, monospaced" },
        {label : '_chrom.radial_grid_line_width', id: 'GENOME.OPTIONS.radial_grid_line_width', cast : Number, defaultValue : null },
        {label : '_chrom.listener', id: 'GENOME.OPTIONS.listener', cast: Function, defaultValue : function() {
            return null;
        }},

        {label : '_plot.enable_pan', id: 'PLOT.enable_pan', cast: Boolean, defaultValue : false },
        {label : '_plot.enable_zoom', id: 'PLOT.enable_zoom', cast: Boolean, defaultValue : false },
        {label : '_plot.show_legend', id: 'PLOT.show_legend', cast: Boolean, defaultValue : false },
        {label : '_plot.legend_corner', id: 'PLOT.legend_corner', cast: String, defaultValue : 'ne' },
        {label : '_plot.legend_radius', id: 'PLOT.legend_radius', cast: Number, defaultValue : 25 },
        {label : '_plot.legend_show_rings', id: 'PLOT.legend_show_rings', cast: Boolean, defaultValue : true },
        {label : '_plot.rotate_degrees', id: 'PLOT.rotate_degrees', cast: Number, defaultValue : 0 },
        {label : '_plot.tooltip_timeout', id: 'PLOT.tooltip_timeout', cast: Number, defaultValue : 200 },
        {label : '_network.data', id: 'NETWORK.DATA.data_array',  optional : true },
        //{label : '_network.radius', id: 'NETWORK.OPTIONS.network_radius', cast : Number, defaultValue : 100 },
        {label : '_network._outer_padding', id: 'NETWORK.OPTIONS.outer_padding',  optional : true },
        {label : '_network.node_listener', id: 'NETWORK.OPTIONS.node_listener', cast: Function, defaultValue : function() {
            return null;
        } },
        {label : '_network.link_listener', id: 'NETWORK.OPTIONS.link_listener', cast: Function, defaultValue : function() {
            return null;
        } },
        {label : '_network.link_tooltipItems', id: 'NETWORK.OPTIONS.link_tooltip_items',
            defaultValue :  { 'Node 1 Chr' : 'sourceNode.chr', 'Node 1 Start' : 'sourceNode.start', 'Node1 End' : 'sourceNode.end',
                'Node 2 Chr' : 'targetNode.chr', 'Node 2 Start' : 'targetNode.start', 'Node 2 End' : 'targetNode.end'} },
        {label : '_network.link_tooltipLinks', id: 'NETWORK.OPTIONS.link_tooltip_links',  defaultValue : {} },
        {label : '_network.link_line_width', id: 'NETWORK.OPTIONS.link_line_width', cast : vq.utils.VisUtils.wrapProperty,
            defaultValue : function(node, link) {
                return 1;
            }},
        {label : '_network.link_alpha', id: 'NETWORK.OPTIONS.link_alpha', cast : vq.utils.VisUtils.wrapProperty,  defaultValue : function() {
            return 0.7;
        } },
        {label : '_network.link_strokeStyle', id: 'NETWORK.OPTIONS.link_stroke_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'steelblue';
        } },
        {label : '_network.node_fillStyle', id: 'NETWORK.OPTIONS.node_fill_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'green';
        } },
        {label : '_network.node_radius', id: 'NETWORK.OPTIONS.node_radius', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 3;
        } },
        {label : '_network.node_key', id: 'NETWORK.OPTIONS.node_key', cast : Function, defaultValue : function(node) {
            return node['chr'];
        } },
        {label : '_network.node_highlightMode', id: 'NETWORK.OPTIONS.node_highlight_mode', cast : String, defaultValue : 'brighten' },
        {label : '_network.node_tooltipFormat', id: 'NETWORK.OPTIONS.node_tooltipFormat', cast : vq.utils.VisUtils.wrapProperty, defaultValue : vq.utils.VisUtils.network_node_title },
        {label : '_network.node_tooltipItems', id: 'NETWORK.OPTIONS.node_tooltip_items', defaultValue :  { Chr : 'chr', Start : 'start', End : 'end'} },
        {label : '_network.node_tooltipLinks', id: 'NETWORK.OPTIONS.node_tooltip_links',  defaultValue : {} },
        {label : '_network.max_node_linkDegree', id: 'NETWORK.OPTIONS.max_node_linkdegree', cast : Number, defaultValue :  9999 },
        {label : '_network.min_node_linkDegree', id: 'NETWORK.OPTIONS.min_node_linkdegree', cast : Number, defaultValue :  0 },
        {label : '_network.node_overlap_distance', id: 'NETWORK.OPTIONS.node_overlap_distance', cast : Number, defaultValue :  12000000.0},
        {label : '_network.tile_nodes', id: 'NETWORK.OPTIONS.tile_nodes', cast : Boolean, defaultValue : false },
        {label : 'ticks._data_array', id: 'TICKS.DATA.data_array',  optional : true },
        {label : 'ticks.tooltipItems', id: 'TICKS.OPTIONS.tooltip_items', defaultValue :  { Chr : 'chr', Start : 'start', End : 'end', Label:'value'} },
        {label : 'ticks.tooltipLinks', id: 'TICKS.OPTIONS.tooltip_links',  defaultValue : {} },
        {label : 'ticks.label_map', id: 'TICKS.OPTIONS.label_map', defaultValue:[
            {key:'',label:''}
        ]},
        {label : 'ticks.render_ticks', id: 'TICKS.OPTIONS.render_ticks', cast : Boolean ,defaultValue: Boolean(true)},
        {label : 'ticks.label_key', id: 'TICKS.OPTIONS.label_key', defaultValue:'value',cast: String},
        {label : 'ticks.height', id: 'TICKS.OPTIONS.height', cast : Number, defaultValue: 60 },
        {label : 'ticks.wedge_width', id: 'TICKS.OPTIONS.wedge_width', cast : Number, defaultValue: 0.2 },
        {label : 'ticks.wedge_height', id: 'TICKS.OPTIONS.wedge_height', cast : Number, defaultValue: 10 },
        {label : 'ticks.outer_padding', id: 'TICKS.OPTIONS.outer_padding', cast : Number, defaultValue: 0 },
        {label : 'ticks.listener', id: 'TICKS.OPTIONS.listener', cast : Function, defaultValue : function() {
            return null;
        } },
        {label : 'ticks.display_legend', id: 'TICKS.OPTIONS.display_legend', cast : Boolean, defaultValue : true },
        {label : 'ticks.legend_corner', id: 'TICKS.OPTIONS.legend_corner', cast : String, defaultValue : 'nw' },
        {label : 'ticks.tile_ticks', id: 'TICKS.OPTIONS.tile_ticks', cast : Boolean, defaultValue: true },
        {label : 'ticks.overlap_distance', id: 'TICKS.OPTIONS.overlap_distance', cast : Number, optional: true},
        {label : 'ticks.fill_style', id: 'TICKS.OPTIONS.fill_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'red';
        }},
        {label : 'ticks.stroke_style', id: 'TICKS.OPTIONS.stroke_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'white';
        }},
        {label : '_wedge' , id:'WEDGE', optional : true}
    ];
};

vq.models.CircVisData.prototype._build_data = function(data_struct) {
    var data = data_struct;

    this._processData(data);

    if (this._wedge) {
        this._wedge = this._wedge.map(function(b) {
            return new vq.models.CircVisData.WedgeData(b);
        });
    }

    this._setupData();
};


vq.models.CircVisData.prototype._setupData = function() {
    var chrom_keys_order={},chrom_length_map,chrom_length_array = [],cnv_map, startAngle = {},
        cnv_array, cnv_height = [], startAngle_map = {},normalizedLength = {},
        deviation = [],median = [], theta = {}, totalChromLength;
    this.normalizedLength,this.theta = [],this.startAngle_map = {};

    var that = this;
    this._plot.id = vq.utils.VisUtils.guid();

//  Ideogram Data

    if (this._chrom.keys == [] || this._chrom.length == []) {
        console.warn('Chromosome/Ideogram information has not been detected.  Please verify that keys and length/key mappings have been ' +
            'passed into the GENOME.DATA object.');
        return;
    }

    var chrom_keys_array = this._chrom.keys;       //array in pre-sorted order    
    _.each(chrom_keys_array,function(val,index){chrom_keys_order[val]=index;});

    chrom_length_array = this._chrom.length.filter(function(d) {
        return chrom_keys_order[d['chr_name']] != null;
    });
    chrom_length_array.sort(function(c, d) {
        return chrom_keys_order[c['chr_name']] - chrom_keys_order[d['chr_name']] > 0;
    });  //sort by given order
    totalChromLength = vq.sum(chrom_length_array, function(d) {
        return d['chr_length'];
    });


   var rescaleForGaps = 1-(this._chrom.gap_degrees * chrom_keys_array.length / 360);

    chrom_length_map = {};
    _.each(chrom_length_array,function(obj) {
        chrom_length_map[obj['chr_name'].toUpperCase()] = obj['chr_length'];
        normalizedLength[obj['chr_name'].toUpperCase()] =  (obj['chr_length'] *rescaleForGaps) / totalChromLength;
    });

    this.normalizedLength = normalizedLength;

    var chrom_groups = {};

    var rotation = (this._plot.rotate_degrees) * Math.PI / 180;

    var renormalize_factor =  this._chrom.gap_degrees * Math.PI / 180; //radians

    //for each index of chrom_keys ( pre-sorted)
    // sum all lengths from 1st index to last index of chrom_length (sorted to chrom_length)
    _.each(chrom_keys_array,function(d,index) {
        startAngle[d] = _.reduce(chrom_keys_array.slice(0, (chrom_keys_order[d])),
            function(a,b,index) {
                return a+(normalizedLength[chrom_keys_array[index]] * 2 * Math.PI)+renormalize_factor;
            },0);

        theta[d] = d3.scale.linear().domain([0, chrom_length_map[d.toUpperCase()]])
            .range([0, 2 * Math.PI * normalizedLength[d]]);

        if (that._chrom.reverse_list != undefined &&
            that._chrom.reverse_list.filter(
                function(c) {
                    return c == d;
                }).length > 0) {  //defined as reversed!
            theta[d] = d3.scale.linear().domain([0, chrom_length_map[d.toUpperCase()]])
                .range([2 * Math.PI * normalizedLength[d], 0]);

        } else {
            theta[d] = d3.scale.linear().domain([0, chrom_length_map[d.toUpperCase()]])
                .range([0, 2 * Math.PI * normalizedLength[d]]);

        }
        chrom_groups[d]={key:d, startAngle: startAngle[d], endAngle: startAngle[d] + 2 * Math.PI * normalizedLength[d], theta:theta[d],
            angle: 2 * Math.PI * normalizedLength[d]};
    });

    this.theta = theta;
    this._ideograms={};
    _.each(that._chrom.keys, function(d) {
        startAngle_map[d] =  startAngle[d] + rotation;
        that._ideograms[d] = _.extend(chrom_groups[d],{wedge:[],_feature_angle : function(a) { return this.startAngle + this.theta(a); }});
    });
    this.startAngle_map = startAngle_map;
    this._chrom.groups = chrom_groups;

//    Ring Data

    if (this._wedge != undefined) {
        _.each(this._wedge,function(wedge, index) {

            if (wedge._plot_type == 'tile' || wedge._plot_type == 'glyph') {
                var max_tile_level = wedge._tile.show_all_tiles ?
                    Math.floor((wedge._plot_height - (wedge._radius() * 4)) / (wedge._tile.height + wedge._tile.padding)) :
                    undefined;
                wedge._data = (wedge._plot_type == 'tile' ? vq.utils.VisUtils.layoutChrTiles(wedge._data, wedge._tile.overlap_distance, max_tile_level) :
                    vq.utils.VisUtils.layoutChrTicks(wedge._data, wedge._tile.overlap_distance, max_tile_level));
            }

            cnv_map = {};
            _.each(wedge._data, function(d) {
                if (cnv_map[d.chr] === undefined) { cnv_map[d.chr] = [];}
                cnv_map[d.chr].push(d);
            });

            wedge._chr = {};
            _.each(that._chrom.keys, function(d) {
                wedge._chr[d] =  cnv_map[d] === undefined ? [] : _.extend(cnv_map[d],chrom_groups[d]);
            });
            wedge._outerRadius =
                (that._plot.height / 2) -
                    vq.sum(that._wedge.slice(0, index), function(a) {
                        return a._plot_height + a._outer_padding;
                    }) - (that.ticks.outer_padding + that.ticks.height);

            wedge._outerPlotRadius = wedge._outerRadius - wedge._outer_padding;

            wedge._innerRadius = wedge._outerPlotRadius - wedge._plot_height;

            that._chrom.keys.forEach(function(d) {
                that._ideograms[d]._outerRadius = (that._plot.height / 2) - (that.ticks.outer_padding + that.ticks.height);
                that._ideograms[d].wedge[index] = wedge._chr[d]; //?
            });

            wedge.hovercard = vq.hovercard({
                canvas_id : that._plot.id,
                include_header : false,
                include_footer : true,
                self_hover : true,
                timeout : that._plot.tooltip_timeout,
                data_config : wedge._tooltipItems,
                tool_config : wedge._tooltipLinks
            });

            if(wedge._plot_type =='karyotype') { return;}

            var value_label = wedge._value_key;
            deviation = Math.sqrt(science.stats.variance(_.pluck(wedge._data,value_label)));
            median = science.stats.median(_.pluck(wedge._data,value_label));

            wedge._min_plotValue = (wedge._min_plotValue === undefined) ? parseFloat(((-1 * deviation) + median).toFixed(2)) : wedge._min_plotValue;
            wedge._max_plotValue = (wedge._max_plotValue === undefined) ? parseFloat((deviation + median).toFixed(2)) : wedge._max_plotValue;
            wedge._range_mean = wedge._base_plotValue != null ? wedge._base_plotValue : (wedge._min_plotValue + wedge._max_plotValue) / 2;
            wedge._y_linear = d3.scale.linear()
                .domain([wedge._min_plotValue, wedge._max_plotValue])
                .range([wedge._innerRadius,wedge._outerRadius - wedge._outer_padding]).nice();

            wedge._y_axis = d3.scale.linear().domain([wedge._min_plotValue, wedge._max_plotValue]).range([wedge._innerRadius,wedge._outerPlotRadius]);
            wedge._thresholded_innerRadius = function(d) { return Math.max(wedge._y_axis(Math.min(d,wedge._range_mean)),wedge._innerRadius); };
            wedge._thresholded_outerRadius = function(d) { return Math.min(wedge._y_axis(Math.max(d,wedge._range_mean)),wedge._outerPlotRadius); };
            wedge._thresholded_value_to_radius = function(d) { return Math.min(Math.max(wedge._y_axis(d),wedge._innerRadius),wedge._outerPlotRadius); };
            wedge._thresholded_radius = function(d) { return Math.min(Math.max(d,wedge._innerRadius),wedge._outerPlotRadius); };

            wedge._thresholded_tile_innerRadius = function(c,d) { return wedge._innerRadius + (d._tile.height + d._tile.padding) * c.level;};
            wedge._thresholded_tile_outerRadius = function(c,d) { return wedge._innerRadius + ((d._tile.height + d._tile.padding) * c.level) + d._tile.height;};
            if (wedge._plot_type == 'glyph') {
                wedge._glyph_distance = function(c) { return (((wedge._tile.height + wedge._tile.padding) * c.level)
                    + wedge._innerRadius + (wedge._radius(c)));};
                wedge._checked_endAngle = function(feature,chr) {
                    if (that._chrom.keys.length == 1) {
                        return Math.min(that.startAngle_map[chr] + that.theta[chr](feature.end||feature.start+1),that.startAngle_map[that._chrom.keys[0]] + (Math.PI * 2));
                    }
                    else if (this.parent.index+1 == that._chrom.keys.length) {
                        return Math.min(that.startAngle_map[chr] + that.theta[chr](feature.end||feature.start+1),that.startAngle_map[that._chrom.keys[0]] + (Math.PI * 2));
                    }
                    else {return Math.min(that.startAngle_map[chr] + that.theta[chr](feature.end||feature.start+1),
                        that.startAngle_map[that._chrom.keys[(this.parent.index+1)%that._chrom.keys.length]]);
                    }
                };
            }
            delete wedge._data;

        }); //foreach
    }


//    Tick Data

    if (this.ticks != undefined && this.ticks._data_array != undefined && this.ticks._data_array != null) {
        if (that.ticks.overlap_distance === undefined) {
            var overlap_ratio = 7000000.0 / 3080419480;
            that.ticks.overlap_distance = overlap_ratio * totalChromLength;
        }
        var tick_array = that.ticks.render_ticks && that.ticks.tile_ticks ? vq.utils.VisUtils.layoutChrTicks(that.ticks._data_array, that.ticks.overlap_distance) :
            that.ticks._data_array;

        var ticks_map = {};
        _.each(tick_array,function(d) {
            if (ticks_map[d.chr] === undefined) { ticks_map[d.chr] = new Array();}
            ticks_map[d.chr].push(d);
        });

        this.ticks.data_map = {};
        _.each(that._chrom.keys, function(d) {
            that.ticks.data_map[d] =  ticks_map[d] === undefined ? [] : ticks_map[d];
        });
        this.ticks._data_array = [];
        delete tick_array;
        ticks_map = [];

        this.ticks.hovercard =  vq.hovercard({
            canvas_id : that._plot.id,
            include_header : false,
            include_footer : true,
            self_hover : true,
            timeout : that._plot.tooltip_timeout,
            data_config : that.ticks.tooltipItems,
            tool_config : that.ticks.tooltipLinks
        });

    }

    //------------------- NETWORK DATA
    var nodes = {};
    _.each(that._chrom.keys, function(d) {
        nodes[d] = {};
    });
    var node_parent_map = {};
    var node_array = [{parent:null, chr:null, radius:0, angle:0,children:[]}];
    that._network.network_radius = {};
    chrom_keys_array.forEach(function(key,index) {
        var innerRadius = that._ideograms[key].wedge.length > 0 ? that._wedge[that._ideograms[key].wedge.length-1]._innerRadius :
            (that._plot.height / 2) - that.ticks.outer_padding - that.ticks.height;
        var network_radius = that._network.network_radius[key] = innerRadius - that._network._outer_padding;
        node_parent_map[key] = index + 1;
        var node = {chr:key,parent:node_array[0],children:[],radius: network_radius / 2,
            angle : (that._chrom.groups[key].startAngle + that._chrom.groups[key].endAngle)/2};
        node_array[0].children.push(node);
        node_array.push(node);
    });

    this._network.node_parent_map = node_parent_map;
    this._network.base_nodes = _.map(node_array,function(node){return _.extend({},node);});
    this._network.data_nodes_map=Object.create(null);
    this._network.links_map=Object.create(null);
  
        this._network.nodes_array=node_array;
        this._network.links_array=[];

        this._network.link_hovercard  =  vq.hovercard({
            canvas_id : that._plot.id,
            include_header : false,
            include_footer : true,
            self_hover : true,
            timeout : that._plot.tooltip_timeout,
            data_config : that._network.link_tooltipItems,
            tool_config : that._network.link_tooltipLinks
        });
        this._network.node_hovercard  =  vq.hovercard({
            canvas_id : that._plot.id,
            include_header : false,
            include_footer : true,
            self_hover : true,
            timeout : that._plot.tooltip_timeout,
            data_config : that._network.node_tooltipItems,
            tool_config : that._network.node_tooltipLinks
        });

        //var edges = _.filter(_.map(that._network.data, vq.models.CircVisData.prototype._insertEdge, that),
        //function(edge) { return !_.isNull(edge);});
    this._insertEdges(that._network.data);

    this.setDataReady(true);
};


vq.models.CircVisData.prototype._remove_wedge_data = function(node) {
    var that = this;
    var chr = node.chr;
    _.each(this._ideograms[chr].wedge, function(wedge,index) {
        that._ideograms[chr].wedge[index] = _.reject(wedge,
            function(obj) { return that.same_feature(obj,node);});
    });
};

vq.models.CircVisData.prototype._add_wedge_data = function(data) {
    var that = this;
    var chr = data.chr;
    _.each(this._ideograms[chr].wedge, function(wedge,index) {
        if(_.isUndefined(data[that._wedge[index]._value_key]) || that._wedge[index]._plot_type =='karyotype') { return;}
        wedge.push(data);
    });
};

vq.models.CircVisData.prototype.same_feature = function(n1,n2) {
    return this._network.node_key(n1) ==  this._network.node_key(n2);
};

vq.models.CircVisData.prototype.same_edge= function(rf_assoc,circvis_assoc) {
    return this.same_feature(rf_assoc.source,circvis_assoc.source) &&
        this.same_feature(rf_assoc.target,circvis_assoc.target);
};

vq.models.CircVisData.prototype._add_tick_data = function(node) {
    var that = this;
    var tick;
    if ( _.any(that.ticks.data_map[node.chr],
        function(tick) { return that.same_feature(tick,node);})) {
        tick = _.find(that.ticks.data_map[node.chr],
            function(n) { return that.same_feature(n,node);});
    }
    else {
        tick = node;
        vq.utils.VisUtils.layoutTile(tick,that.ticks.data_map[tick.chr].length,
            that.ticks.data_map[tick.chr],that.ticks.overlap_distance);
        that.ticks.data_map[tick.chr].push(tick);
    }

    return tick;
};

vq.models.CircVisData.prototype._add_network_node = function(node) {
    var that = this;
    var node_parent_map = this._network.node_parent_map;

    function include_node(node) {
        var new_node;
        var index = that._network.data_nodes_map[that._network.node_key(node)];
        var parent = that._network.nodes_array[node_parent_map[node.chr]];
        //previously loaded this node, pull it from the node_array
        if (_.isUndefined(index)) {
            new_node = _.extend({parent:parent},node);
            parent.children.push(new_node);
            that._network.data_nodes_map[that._network.node_key(node)] = that._network.nodes_array.push(new_node) - 1;   
            return new_node;
        }
        else {
            return that._network.nodes_array[index]
        }
    }

    if (_.isArray(node)) { return _.map(node,include_node,that);}
    return include_node(node);

};


vq.models.CircVisData.prototype._remove_network_node = function(node) {
    var that = this;

    function remove_node(node) {
        var new_node;
        var index = this._network.data_nodes_map[this._network.node_key(node)];
        //previously loaded this node, pull it from the node_array
        if (_.isDefined(index)) {
             that._network.nodes_array[index] = undefined;
             that._network.data_nodes_map[that._network.node_key(node)] = undefined;
        }
    }

    if (_.isArray(node)) { _.map(node,remove_node,that);}
    else { remove_node(node); }
};

vq.models.CircVisData.prototype._remove_tick_data = function(node) {
    var that = this;
    this.ticks.data_map[node.chr] = _.reject(this.ticks.data_map[node.chr],
        function(obj) { return that.same_feature(obj,node);});
};

vq.models.CircVisData.prototype._insertNode = function(node) {
    var that = this;
    var new_node;

    if (!_.include(_.keys(that._chrom.groups),node.chr)) {return null;}
    //previously loaded this node, pull it from the node_array

    this._add_tick_data(node);
    new_node = this._add_network_node(node);
    this._add_wedge_data(node);
    return new_node;
};

vq.models.CircVisData.prototype._insertNodes = function(node_array) {
    var that = this;
    var nodes = [];
    var insert_nodes = that.add_network_node(node_array);
    _.each(insert_nodes, function(node) {
             that._add_wedge_data(node);
        }
    );
    //this._retileNodes();
    return nodes;
};

vq.models.CircVisData.prototype._retileNodes = function() {
    if (this._network.tile_nodes) {
        var nodes = _.reject(this._network.nodes_array,function(node) { return node.children;});
        nodes = vq.utils.VisUtils.layoutChrTiles(nodes ,this._network.node_overlap_distance);
        this._network.nodes_array = _.union(this._network.base_nodes, nodes);
    }
};

vq.models.CircVisData.prototype._removeNode = function(node) {
    if (!_.isObject(node)) { return; }
    this._remove_tick_data(node);
    this._remove_network_node(node);
    this._remove_wedge_data(node);
};

vq.models.CircVisData.prototype._insertEdges = function(edge_array) {
    var that = this;
    var node_array = _.flatten(_.map(edge_array, function(edge) { return [edge.node1,edge.node2];}));
    this._add_network_node(node_array);

    function insert_edge(edge) {
        var node_key = this._network.node_key;
        var node1 = edge.node1, node2 = edge.node2;
        var node1_key = node_key(node1), node2_key = node_key(node2);
        var edge_key =node1_key +'_'+ node2_key;
        var index = this._network.links_map[edge_key];

        if (_.isUndefined(index)) { //link does not yet exist
            var insert_edge = _.extend( {source:that._network.nodes_array[that._network.data_nodes_map[node1_key]],
                target:that._network.nodes_array[that._network.data_nodes_map[node2_key]] }
                , edge);
            this._network.links_map[edge_key] = this._network.links_array.push(insert_edge) -1;  //add it
            }
        }
        _.map(edge_array,insert_edge,that);
};


vq.models.CircVisData.prototype._insertEdge = function(edge) {
    var nodes = [edge.node1,edge.node2];
    var that = this;

    //quit if either node has an unmappable location
    if(_.any(nodes,function(a){return _.isNull(a) ||
        !_.include(_.keys(that._chrom.groups),a.chr); })) {
        console.log('Unmappable chromosome in edge.');
        return null;
    }
    //insert/recover both nodes
    var edge_arr = that._insertNodes([nodes[0],nodes[1]]);
    if(_.any(edge_arr,function(a){return _.isNull(a);})) {
        console.error('Unable to insert node for requested edge'); return null;
    }

    //list of keys that aren't node1,node2
    var keys = _.chain(edge).keys().reject(function(a){return a=='node1'|| a== 'node2';}).value();
    //append the source,target nodes
    var insert_edge = _.chain(edge).pick(keys).extend({source:edge_arr[0],target:edge_arr[1]}).value();

    //search for edge in current data
    if (_.any(this._network.links_array,function(link) { return that.same_edge(insert_edge,link);})){
        return null;//old link
    }else {  //insert new edge
        this._network.links_array.push(insert_edge);  //add it
    }
    return insert_edge;
};

vq.models.CircVisData.prototype._removeEdge = function(edge) {
    var that = this;
    if (_.isObject(edge)) {
        this._network.links_array =
            _.reject(this._network.links_array,function(link) { return that.same_edge(link,edge);});
    }

};

vq.models.CircVisData.prototype._removeEdges = function(edge_arr) {
    var that = this;
    if (_.isArray(edge_arr)) {
        this._network.links_array =
            _.difference(that._network.links_array,edge_arr);
    }

};



/**
 *
 * @class Internal data model for ring plots.
 *
 * @param data {JSON Object} - Configures a single ring plot.
 * @extends vq.models.VisData
 */
vq.models.CircVisData.WedgeData = function(data) {

    vq.models.VisData.call(this, {CONTENTS:data});

    this.setDataModel();
    this._build_data(this.getContents())

};

vq.models.CircVisData.WedgeData.prototype = vq.extend(vq.models.VisData);

vq.models.CircVisData.WedgeData.prototype.setDataModel = function() {
    this._dataModel = [
        {label : '_data', id: 'DATA.data_array', defaultValue : [
            {"chr": "1", "end": 12784268, "start": 644269,
                "value": -0.058664}
        ]},
        {label : '_value_key', id: 'DATA.value_key', defaultValue : 'value',cast: String },
        {label : '_hash', id: 'DATA.hash', defaultValue : 'label',cast: String },
        {label : 'listener', id: 'OPTIONS.listener', defaultValue :  function(a, b) {
        } },
        {label : '_plot_type', id: 'PLOT.type', defaultValue : 'histogram' },
        {label : '_plot_height', id: 'PLOT.height', cast: Number, defaultValue : 100 },
        {label : '_fillStyle', id: 'OPTIONS.fill_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function(d) {
            return 'red';
        } },
        {label : '_strokeStyle', id: 'OPTIONS.stroke_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function(d) {
            return 'black';
        } },
         {label : '_lineWidth', id: 'OPTIONS.line_width', cast : Number, defaultValue : 0.5 },
        {label : '_shape', id: 'OPTIONS.shape', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function(d) {
            return 'circle';
        } },
        {label : '_radius', id: 'OPTIONS.radius', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function(d) {
            return 2;
        } },
        {label : '_outer_padding', id: 'OPTIONS.outer_padding', cast : Number, defaultValue : 1 },
        {label : '_min_plotValue', id: 'OPTIONS.min_value',  cast : Number , optional : true },
        {label : '_max_plotValue', id: 'OPTIONS.max_value',  cast : Number , optional : true },
        {label : '_base_plotValue', id: 'OPTIONS.base_value', cast: Number, optional : true },
        {label : '_legend_label', id: 'OPTIONS.legend_label', cast: String, defaultValue : '' },
        {label : '_legend_desc', id: 'OPTIONS.legend_description', cast: String, defaultValue : '' },
        {label : '_draw_axes', id: 'OPTIONS.draw_axes', cast: Boolean, defaultValue : true },
        {label : '_tooltipFormat', id: 'OPTIONS.tooltipFormat', cast :vq.utils.VisUtils.wrapProperty,
            defaultValue : function(c, d) {
                return "Chr " + d + "\nStart: " + c.start + "\nEnd: " + c.end;
            }   },
        {label : '_tooltipItems', id: 'OPTIONS.tooltip_items',  defaultValue : {Chr:'chr',Start:'start',End:'end',Value:'value'} },
        {label : '_tooltipLinks', id: 'OPTIONS.tooltip_links',  defaultValue : {} },
        {label : '_tile.padding', id: 'OPTIONS.tile_padding', cast: Number, defaultValue : 5 },
        {label : '_tile.overlap_distance', id: 'OPTIONS.tile_overlap_distance', cast: Number, defaultValue : 0.1 },
        {label : '_tile.height', id: 'OPTIONS.tile_height', cast: Number, defaultValue : 5 },
        {label : '_tile.show_all_tiles', id: 'OPTIONS.tile_show_all_tiles', cast: Boolean, defaultValue : false }
    ];
};

vq.models.CircVisData.WedgeData.prototype._build_data = function(data_struct) {
    this._processData(data_struct)
};
/*EDGES*/

vq.CircVis.prototype.addEdges = function(edge_array,ignore_nodes) {
    var ignore = _.isBoolean(ignore_nodes) ? ignore_nodes : Boolean(false);
    var edges;
    if (_.isArray(edge_array)) {
        edges = this._insertEdges(edge_array);
    }
    else {
        edges = this._insertEdges([edge_array]);
    }
    this._drawNetworkLinks();

    if (ignore) { return;}

    var nodes = _.flatten(_.map(edges, function(edge) { return [edge.source,edge.target];}));
    this.addNodes(nodes);
};

vq.CircVis.prototype.removeEdges = function(edge_array, ignore_nodes) {
    var that = this;
    var ignore = _.isBoolean(ignore_nodes) ? ignore_nodes : Boolean(false);
    if (edge_array === 'all') {
            edge_array = this.chromoData._network.links_array;
        }

    if (_.isArray(edge_array)) {
        _.each(edge_array,function(edge) {that.chromoData._removeEdge(edge);});
    }
    else if ( _.isObject(edge_array)){
        this.chromoData._removeEdge(edge_array);
    }

    this._drawNetworkLinks();

    if(ignore) {return;}

    var removable = this._edgeListToNodeList(edge_array);
    var remaining_nodes = this._edgeListToNodeList(this.chromoData._network.links_array);
    var nodes_to_remove = _.difference(removable,remaining_nodes);
    this.removeNodes(nodes_to_remove);

};


vq.CircVis.prototype._insertEdges = function(edge_array) {
    //return the array of edges inserted
    return _.filter(_.map(edge_array, vq.models.CircVisData.prototype._insertEdge, this.chromoData),
        function(edge) { return !_.isNull(edge);});
};

/* NODES*/

vq.CircVis.prototype.addNodes = function(node_array) {
    var nodes;
    var that = this;
    if (_.isArray(node_array)) {
       nodes = this.chromoData._insertNodes(node_array);
    }
    else {
        nodes = this.chromoData._insertNodes([node_array]);
    }
    nodes = _.reject(nodes,function(n) {return _.isNull(n);});
    _.each(_.uniq(_.pluck(nodes,'chr')), function(chr) {
               that._drawTicks(chr);
               that._drawNetworkNodes(chr);
               that._drawWedgeData(chr);
           });
};

vq.CircVis.prototype.removeNodes = function(node_array) {
    var that = this;
    if (_.isFunction(node_array)) {
        node_array = _.filter(this.chromoData._network.nodes_array, node_array);
    }

    if (_.isArray(node_array)) {
        _.each(node_array, function(node) {
            that.chromoData._removeNode(node);
        });
        this.chromoData._retileNodes();
        _.each(_.uniq(_.pluck(node_array,'chr')), function(chr) {
            that._drawTicks(chr);
            that._drawNetworkNodes(chr);
            that._drawWedgeData(chr);
        });
    }
    else if (_.isObject(node_array)){
        that.chromoData._removeNode(node_array);
        that._drawTicks(node_array.chr);
        that._drawNetworkNodes(node_array.chr);
        that._drawWedgeData(node_array.chr);
    }

};


/*Utils*/

vq.CircVis.prototype._edgeListToNodeList = function(edges) {
    return _.uniq(_.flatten(_.chain(edges).map(function(edge){return [edge.source,edge.target];}).value()));
};