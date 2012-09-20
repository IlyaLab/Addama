
diagonal_directed = function() {
 

  function diagonal(d, i) {
    var p0 = source.call(this, d, i),
        p3 = target.call(this, d, i),
        m = Math.max(16,Math.abs((p0.y - p3.y) / 2)),
        p = [p0, {x: p0.x, y: p0.y+m}, {x: p3.x, y: p3.y-m}, p3];
    p = p.map(projection);
    return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
  }

  diagonal.source = function(x) {
    if (!arguments.length) return source;
    source = x;
    return diagonal;
  };

  diagonal.target = function(x) {
    if (!arguments.length) return target;
    target = x;
    return diagonal;
  };

  diagonal.projection = function(x) {
    if (!arguments.length) return projection;
    projection = x;
    return diagonal;
  };

  return diagonal;
};


var TreeChart = function(config) {
	var width = config.width || 400,
		height = config.height || 300,
		scaleExtent = config.scaleExtent || [0.5,8],
		padded_width = width,
	 	padded_height = height,
	 	node_list = config.nodes.data,
		x = config.nodes.x || 'x',
		y = config.nodes.y || 'y',
		label=config.nodes.label || 'label',
	 	links = config.edges.data,
	 	overlay_scale = 4,
	 	dx = 8,
	 	dy = 3,
	 	circle = {radius : 4.5},
	 	link = new Object(),
	 	edgeOpacity = 1.0,
	 	nodeOpacity = 1.0,
	 	nodes,
	 	edges,
	 	xScale,
	 	yScale,
	 	vis;
	
	var	parseAdj = function(element) { 
		return function(link) { 
	      var index = link[element];
	      return {
	      		x:node_list[index]._pos.x,
	      		y:node_list[index]._pos.y
	      		};
	      };
	  };

    var source = parseAdj(1),
        target = parseAdj(0);

	var diagonal = diagonal_directed()
	      .source(source)
		  .target(target)
	      .projection(function(d) { return [d.y, d.x]; });

	 function treeChart(selection) {
	 	selection = selection || document.body;	

	 	xScale = d3.scale.linear()
	 						.domain(d3.extent(_.pluck(node_list,x)))
	 						.range([10,padded_height-10]);

		yScale = d3.scale.linear()
	 						.domain(d3.extent(_.pluck(node_list,y)))
	 						.range([[padded_width-40],10]);

	 	_.each(node_list,function(node) {
	 		node._pos = {
	 				x:xScale(node[x]),
	 				y:yScale(node[y])
	 		};
	 	});

	 	selection.each(function render(){

	 		var zoom = function() {
	 			var scale = d3.event.scale;
	 			vis.attr('transform','translate('+d3.event.translate+')scale(' + scale + ')');
	 			d3.selectAll('.node circle')
	 				.attr('r', circle.radius/scale)
	 				.style('stroke-width', circle.stroke_width/scale+'px');

	 			d3.selectAll('.node text')
	 					.attr('dx',dx / scale).attr('dy', dy / scale)
	 					.style('font-size',12 / scale + 'px');

	 			d3.selectAll('.link')
	 				.style('stroke-width',link.stroke_width/scale+'px');
	 		};
	 
			var svg = d3.select(this).append("svg")
						     .attr("width", padded_width)
						     .attr("height", padded_height);

					 	 	svg.append('defs')
					 	 		.append('clipPath')
					 	 		.attr('id','boundary')
					    	 	.append('rect')
					    	 	.attr("width",padded_width)
					    	 	.attr("height",padded_height);

						vis = svg.append("g")
						     .attr('clip-path','url(#boundary)')
						     .call(d3.behavior.zoom().scaleExtent(scaleExtent).on("zoom", zoom))
							.append("g");

						vis.append('rect')	
							.attr('class','graph-border');

							var overlay_width = padded_width*overlay_scale,
							overlay_height = padded_height*overlay_scale;

					  vis.append('rect')
					  		 .attr('class','overlay')
					    	 .attr("width", overlay_width)
					    	 .attr("height", overlay_width)
					    	 .attr("transform","translate("+ (-0.5*overlay_width) + "," + (-0.5*overlay_height)+")");

		     edges = vis.selectAll("path.link")
	    				   .data(links)
					    .enter().append("path")
					       .attr("class", "link")
					       .attr('stroke-opacity',edgeOpacity)
					       .attr("d", diagonal);		    
				 
			   nodes = vis.selectAll("g.node")
					       .data(node_list,function(d) { return d[label];})
					     .enter().append("g")
					       .attr("class", "node")
					       .attr('stroke-opacity',nodeOpacity)
					       .attr('fill-opacity',nodeOpacity)
					       .attr('transform',function(d) { return 'translate(' + d._pos.y+","+d._pos.x+")";})
					       .call(dragGroup);

					   nodes.append("circle")
					       .attr("r", circle.radius)
					       .attr('cursor','pointer')
					       .on('mouseover',highlightSubTree)
					       .on('mouseout',removeHighlights);
					      					 
					   nodes.append("text")
					       .attr("dx", function(d,i) { return dx; })
					       .attr("dy", 3)
					       .attr("text-anchor","start")
					       .text(function(d) { return d[label];});
		});

		circle.stroke_width = d3.selectAll('.node circle').style('stroke-width').slice(0,-2);
	 	link.stroke_width = d3.selectAll('.link').style('stroke-width').slice(0,-2);
	}

			var dragGroup = d3.behavior.drag()
				 .on('drag', function(d, i) {
								    d._pos.y += d3.event.dx;
								    d._pos.x += d3.event.dy;
								    d3.select(this).attr("transform", "translate("+d._pos.y+","+d._pos.x+")");

								    vis.selectAll("path.link")
								     .attr("d", diagonal);
								  });

	treeChart.redraw = function() {
		redrawNodes();
		redrawEdges();
	};

	function redrawEdges() {

	}

	function redrawNodes() {
	    nodes
	       .transition()
	       .attr('stroke-opacity',nodeOpacity)
	       .attr('fill-opacity',nodeOpacity);
	}

	function gatherConnectedPaths(node_index) {
		gatherLowerPaths(node_index);
		gatherUpperPaths(node_index);
	}

	function gatherLowerPaths(node_index) {
		var edges = d3.selectAll('path.link')
					.filter(function(d,i) { return d[0] === node_index; })
					.classed('connected_lower',true);
	}

	function gatherUpperPaths(node_index) {
		var edges = d3.selectAll('path.link')
							.filter(function(d,i) { return d[1] === node_index; })
							.classed('connected_upper',true);
	}

	function highlightSubTree(node_data, node_index) {
			gatherConnectedPaths(node_index);
	}

	function removeHighlights() {
			var selection = d3.selectAll('.connected_lower')
					.classed('connected_lower',false);
			var selection = d3.selectAll('.connected_upper')
							.classed('connected_upper',false);											
	}

	treeChart.width = function(value) {
		if (!arguments.length) return width;
	    width = value;
	    return this;
	};

	treeChart.height = function(value) {
		if (!arguments.length) return height;
	    height = value;
	    return this;
	};

	treeChart.data = function(value) {
		if (!arguments.length) return data;
	    data = value;
	    return this;
	};

	treeChart.edgeOpacity = function(callback) {
		if (!arguments.length) return callback;
	    edgeOpacity = callback;
	    return this;
	}

	treeChart.nodeOpacity = function(callback) {
		if (!arguments.length) return callback;
	    nodeOpacity = callback;
	    return this;
	}

	return treeChart;
};

module.exports = TreeChart;