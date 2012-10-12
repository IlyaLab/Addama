var TreeChart = function(config) {
	var width = config.width || 400,
		height = config.height || 300,
		scaleExtent = config.scaleExtent || [0.5,8],
	 	node_list = config.nodes.data,
		nodeConfig = {
		id : config.nodes.id || 'feature_id',
		x : config.nodes.x || 'x',
		y : config.nodes.y || 'y',
		label:config.nodes.label || 'label'
		},
	 	links = config.edges.data,
	 	overlay_scale = 4,
	 	dx = 8,
	 	dy = 3,
	 	circle = {radius : 4.5},
	 	link = new Object(),
	 	edgeOpacity = 1.0,
	 	nodeOpacity = 1.0,
	 	edgeRouting = 'straight',
	 	edgeRoute,
	 	nodes,
	 	edges,
	 	xScale,
	 	yScale,
	 	scale = 1,
	 	vis;

	 var nodeClickListener = new Function(),
	 	 edgeClickListener = new Function();
	
	var	parseAdj = function(element) { 
		return function(link) { 
	      var index = link[element];
	      return {
	      		x:node_list[index]._pos.x,
	      		y:node_list[index]._pos.y
	      		};
	      };
	  };

    var source = parseAdj('source'),
        target = parseAdj('target');

	 function treeChart(selection) {
	 	selection = selection || document.body;	

	 	setupData();

	 	edgeRoute = setEdgeRoute();

	 	selection.each(function render(){

	 		var zoom = function() {
	 			scale = d3.event.scale;
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
						     .attr("width", width)
						     .attr("height", height);

					 	 	svg.append('defs')
					 	 		.append('clipPath')
					 	 		.attr('id','boundary')
					    	 	.append('rect')
					    	 	.attr("width",width)
					    	 	.attr("height",height);

						vis = svg.append("g")
						     .attr('clip-path','url(#boundary)')
						     .call(d3.behavior.zoom().scaleExtent(scaleExtent).on("zoom", zoom))
							.append("g");

						vis.append('rect')	
							.attr('class','graph-border');

							var overlay_width = width*overlay_scale,
							overlay_height = height*overlay_scale;

					  vis.append('rect')
					  		 .attr('class','overlay')
					    	 .attr("width", overlay_width)
					    	 .attr("height", overlay_width)
					    	 .attr("transform","translate("+ (-0.5*overlay_width) + "," + (-0.5*overlay_height)+")");

		     edges = vis.selectAll("path.link")
	    				   .data(links, function(l) { return l.edge_id;})
					    .enter().append("path")
					       .attr("class", "link")
					       .style('stroke-opacity',edgeOpacity)
					       .attr("d", edgeRoute)
					       .on('click',edgeClickListener);
				 
			   nodes = vis.selectAll("g.node")
					       .data(node_list,function(d) { return d[nodeConfig.id];})
					     .enter().append("g")
					       .attr("class", "node")
					       .attr('cursor','pointer')
					       .style('stroke-opacity',nodeOpacity)
					       .style('fill-opacity',nodeOpacity)
					       .attr('transform',function(d) { return 'translate(' + d._pos.y+","+d._pos.x+")";})
					       .on('mouseover',highlightSubTree)
					       .on('mouseout',removeHighlights)
					       .on('click',nodeClickListener)
					       .call(dragGroup);

					   nodes.append("circle")
					       .attr("r", circle.radius);
					      					 
					   nodes.append("text")
					       .attr("dx", function(d,i) { return dx; })
					       .attr("dy", 3)
					       .attr("text-anchor","start")
					       .text(function(d) { return d[nodeConfig.label];});
		});

		circle.stroke_width = d3.selectAll('.node circle').style('stroke-width').slice(0,-2);
	 	link.stroke_width = d3.selectAll('.link').style('stroke-width').slice(0,-2);

	 	return this;
	}

			var dragGroup = d3.behavior.drag()
				 .on('drag', function(d, i) {
								    d._pos.y += d3.event.dx;
								    d._pos.x += d3.event.dy;
								    d3.select(this).attr("transform", "translate("+d._pos.y+","+d._pos.x+")");

								    vis.selectAll("path.link")
								     .attr("d", edgeRoute);
								  });

	treeChart.redraw = function(selection) {
		selection.each(function(){
		redrawNodes(this);
		redrawEdges(this);
	});
	};


	function setupData() {

	 	xScale = d3.scale.linear()
	 						.domain(d3.extent(_.pluck(node_list,nodeConfig.x)))
	 						.range([10,height-10]);

		yScale = d3.scale.linear()
	 						.domain(d3.extent(_.pluck(node_list,nodeConfig.y)))
	 						.range([[width-40],10]);

		updatePositionData();
		updateEdgeData();
	 }

	 function updatePositionData() {
	 	 	_.each(node_list,function(node) {
	 		node._pos = {
	 				x:xScale(node[nodeConfig.x]),
	 				y:yScale(node[nodeConfig.y])
	 		};
	 	});
	 }

 	function updateEdgeData() {
		_.each(links, function(l) { 
			l.edge_id = node_list[l.source][nodeConfig.id] + '_' + node_list[l.target][nodeConfig.id]; 
	});
	}

	function redrawEdges(selection) {
		 var edges = d3.select(selection).select('g g').selectAll("path.link")
	    				   .data(links,function(l) { return l.edge_id; });  
 
		    edges.enter()
			    .append("path")
			       .attr("class", "link")
			       .style('stroke-opacity',edgeOpacity)
			       .style('stroke-width',link.stroke_width/scale+'px')
		    	   .attr("d", edgeRoute)
		       	  .on('click',edgeClickListener);       

		    edges.transition()
			.duration(1200)
		    	   .attr("d", edgeRoute);

		    edges.exit().remove();
	}

	function redrawNodes(selection) {
		var nodes = d3.select(selection).select('g g').selectAll('g.node')
	    .data(node_list,function(d) { return d[nodeConfig.id];});
      			
			var g = nodes.enter()
            		.append("g")
	      			.attr("class", "node")
			        .style('cursor','pointer')
			        .style('stroke-opacity',nodeOpacity)
			        .style('fill-opacity',nodeOpacity)
			        .attr('transform',function(d) { return 'translate(' + d._pos.y+","+d._pos.x+")";})
			        .on('mouseover',highlightSubTree)
					.on('mouseout',removeHighlights)
					.on('click',nodeClickListener)
			        .call(dragGroup);

		        g.append("circle")
					       .attr('r', circle.radius/scale)
					       	.style('stroke-width', circle.stroke_width/scale+'px');
					       					      					 
			   g.append("text")
			       		.attr('dx',dx / scale)
			       		.attr('dy', dy / scale)
	 					.style('font-size',12 / scale + 'px')
			       .attr("text-anchor","start")
			       .text(function(d) { return d[nodeConfig.label];});

		     nodes.exit().remove();

		     nodes
		     .transition()
		       .duration(1200)
		       .style('stroke-opacity',nodeOpacity)
			   .style('fill-opacity',nodeOpacity)
			   .attr('transform',function(d) { return 'translate(' + d._pos.y+","+d._pos.x+")";});
			        
	}

	function gatherConnectedPaths(node_index) {
		gatherLowerPaths(node_index);
		gatherUpperPaths(node_index);
	}

	function gatherLowerPaths(node_index) {
		var edges = d3.selectAll('path.link')
					.filter(function(d,i) { return d.target === node_index; })
					.classed('connected_lower',true);
	}

	function gatherUpperPaths(node_index) {
		var edges = d3.selectAll('path.link')
							.filter(function(d,i) { return d.source === node_index; })
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

	function setEdgeRoute() {
		var routes = {'straight': edge_straight, 'diagonal':d3.svg.diagonal, 'diagonal_directed':diagonal_directed};
			return routes[edgeRouting]()
			.source(source)
		    .target(target)
	        .projection(function(d) { return [d.y, d.x]; });
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

	treeChart.nodes = function(value) {
		if (!arguments.length) return node_list;
	    node_list = value;
	    updatePositionData();
	    return this;
	};

	treeChart.nodeConfig = function(config) {
		if (!arguments.length) return nodeConfig;
		
		nodeConfig = _.extend(nodeConfig,config);
		console.log(JSON.stringify(nodeConfig))	;
		setupData();		
		return this;
	};

	treeChart.edges = function(value) {
		if (!arguments.length) return links;
	    links = value;
	    updateEdgeData();
	    return this;
	};

	treeChart.edgeOpacity = function(callback) {
		if (!arguments.length) return callback;
	    edgeOpacity = callback;
	    return this;
	};

	treeChart.nodeOpacity = function(callback) {
		if (!arguments.length) return callback;
	    nodeOpacity = callback;
	    return this;
	};

	treeChart.edgeRoute = function(callback) {
		if (!arguments.length) return callback;
	    edgeRouting = callback;
	    edgeRoute = setEdgeRoute();
	    return this;	
	};

	treeChart.on = function(event,callback) {
		if (!arguments.length) return;
		switch(event) {
				case('node'):
					nodeClickListener = callback;
				break;
				case('edge'):
					edgeClickListener = callback;
				break;
		}
		return this;
	};

	return treeChart;
};

var edge_straight = function() {

	function diagonal(d,i) {
	 var p0 = source.call(this, d, i),
        p3 = target.call(this, d, i),
        p = [p0, p3];
    p = p.map(projection);
    return "M" + p[0] + "L" + p[1];
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

var diagonal_directed = function() {

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

module.exports = TreeChart;