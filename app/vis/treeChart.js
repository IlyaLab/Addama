var TreeChart = function(config) {
	var width = config.width || 400,
		height = config.height || 300,
		data = config.data,
		padding = config.padding || [0,0,0,0],
		scaleExtent = config.scaleExtent || [0.5,8],
		padded_width = width + padding[3] + padding[1],
	 	padded_height = height+ padding[2] + padding[0],
		x_pos = data.x,
	 	y_pos = data.y,
	 	labels = data.labels,
	 	links = data.edges,
	 	dx = 8,
	 	dy = 3,
	 	circle = {radius : 4.5},
	 	link = new Object(),
	 	xScale,
	 	yScale,
	 	vis;
	
	var zipped_data;

	var	parseAdj = function(element) { 
		return function(link) { 
	      var index = link[element];
	      return {
	      		x:zipped_data[index].x,
	      		y:zipped_data[index].y
	      		};
	      };
	  };

    var source = parseAdj(1),
        target = parseAdj(0);

	var diagonal = d3.svg.diagonal()
	      .source(source)
		  .target(target)
	      .projection(function(d) { return [d.y, d.x]; });

	 function treeChart(selection) {
	 	selection = selection || document.body;	

	 	xScale = d3.scale.linear()
	 						.domain(d3.extent(x_pos))
	 						.range([0,width- padding[3] - padding[1]]);
		yScale = d3.scale.linear()
	 						.domain(d3.extent(y_pos))
	 						.range([height - padding[2] - padding[0],0]);

	 	zipped_data = labels.map(function(d,i) { 
		return {
			label:d, 
			x:xScale(x_pos[i]), 
			y:yScale(y_pos[i])};
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
	 
			vis = d3.select(this).append("svg")
						     .attr("width", padded_width)
						     .attr("height", padded_height)
							.append("g")
						     .attr("transform", "translate(" + padding[3] + "," + padding[0] + ")")
						     .call(d3.behavior.zoom().scaleExtent(scaleExtent).on("zoom", zoom))
							.append("g");

					  vis.append('rect')
					  		 .attr('class','overlay')
					    	 .attr("width", padded_width)
					    	 .attr("height", padded_height);

		    var link_svg = vis.selectAll("path.link")
	    				   .data(links)
					    .enter().append("path")
					       .attr("class", "link")
					       .attr("d", diagonal);
		 
		    var dragGroup = d3.behavior.drag()
				 .on('drag', function(d, i) {
								    d.y += d3.event.dx;
								    d.x += d3.event.dy;
								    d3.select(this).attr("transform", "translate("+d.y+","+d.x+")");

								    vis.selectAll("path.link")
								     .attr("d", diagonal);
								  });
				 
			   var node_svg = vis.selectAll("g.node")
					       .data(zipped_data,function(d) { return d['label'];})
					     .enter().append("g")
					       .attr("class", "node")
					       .attr('transform',function(d) { return 'translate(' + d.y+","+d.x+")";})
					       .call(dragGroup);

					   node_svg.append("circle")
					       .attr("r", circle.radius)
					       .attr('cursor','pointer')
					       .on('mouseover',highlightSubTree)
					       .on('mouseout',removeHighlights);
					      					 
					   node_svg.append("text")
					       .attr("dx", function(d,i) { return dx; })
					       .attr("dy", 3)
					       .attr("text-anchor","start")
					       .text(function(d) { return d.label;});
		});

		circle.stroke_width = d3.selectAll('.node circle').style('stroke-width').slice(0,-2);
	 	link.stroke_width = d3.selectAll('.link').style('stroke-width').slice(0,-2);
	}


	function gatherConnectedPaths(node_index) {
		d3.selectAll('.connected_lower').classed('connected_lower',false);
		d3.selectAll('.connected_upper').classed('connected_upper',false);
		gatherLowerPaths(node_index);
		gatherUpperPaths(node_index);
	}

	function gatherLowerPaths(node_index) {
		var edges = d3.selectAll('path.link')
					.filter(':not(.connected_lower)')
					.filter(function(d,i) { return d[0] === node_index; })
					.classed('connected_lower',true);
		
		// var relations = edges.data().map(function(d) { return d[1];});
		// relations.forEach(gatherLowerPaths);
	}

	function gatherUpperPaths(node_index) {
		var edges = d3.selectAll('path.link')
							.filter(':not(.connected_upper)')
							.filter(function(d,i) { return d[1] === node_index; })
							.classed('connected_upper',true);

		// var relations = edges.data().map(function(d) { return d[0];});
		// 		relations.forEach(gatherUpperPaths);
	}

	function highlightSubTree(graph, node_data, node_index) {
			gatherConnectedPaths(node_index);
	}

	function removeHighlights() {
			var selection = d3.selectAll('.connected_lower')
					.classed('connected_lower',false)		
	var selection = d3.selectAll('.connected_upper')
					.classed('connected_upper',false)		
											
	}

	treeChart.width = function(value) {
		if (!arguments.length) return width;
	    width = value;
	    return this;
	}

	treeChart.height = function(value) {
		if (!arguments.length) return height;
	    height = value;
	    return this;
	}

	treeChart.data = function(value) {
		if (!arguments.length) return data;
	    data = value;
	    return this;
	}

	treeChart.redraw = function(value) {
			   var node_svg = vis.selectAll("g.node")
					       .data(zipped_data,function(d) { return d['label'];})
					     .enter().append("g")
					       .attr("class", "node")
					       .attr('transform',function(d) { return 'translate(' + d.y+","+d.x+")";})
					       .call(dragGroup);
					     
					     node_svg.exit().remove();

					   node_svg.append("circle")
					       .attr("r", circle.radius)
					       .attr('cursor','pointer')
					       .on('mouseover',highlightSubTree)
					       .on('mouseout',removeHighlights);
					      					 
					   node_svg.append("text")
					       .attr("dx", function(d,i) { return dx; })
					       .attr("dy", 3)
					       .attr("text-anchor","start")
					       .text(function(d) { return d.label;});
	}

	return treeChart;
};

module.exports = TreeChart;