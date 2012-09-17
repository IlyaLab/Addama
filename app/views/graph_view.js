var View = require('./view');
var template = require('./templates/graph');
var Graph = require('../models/graph');

module.exports = View.extend({

  tagName: 'div',
  model: new Graph,
  
  getRenderData : function() { return {'container':'graph'};},

  afterRender: function() {},

  renderGraph: function() {

        var xScale = d3.scale.linear()
                              .domain([d3.min(graphData.f1),d3.max(graphData.f1)])
                              .range(0,400);


        var yScale = d3.scale.linear()
                              .domain([d3.max(graphData.d),d3.min(graphData.d)])
                              .range(0,400);

       var graph = Viva.Graph.graph();

        _.each(graphData.nByi, function(node,i) {
              graph.addNode( i, { 
                alias: node.split(':')[2], 
                anchor: { 
                  x : xScale(graphData.f1[i]), 
                  y : yScale(graphData.d[i])
                }
              });
         });

        _.each(graphData.adj, function(link) {
             graph.addLink(link[0], link[1]);
        });


        // Set custom nodes appearance
        var graphics = Viva.Graph.View.svgGraphics();
        nodeSize=16;
        graphics.node(function(node) {
               // The function is called every time renderer needs a ui to display node
               var ui = Viva.Graph.svg('g'),
               svgText = Viva.Graph.svg('text')
                                    .attr('y', '-4px')
                                    .text(node.data.alias);

               ui.append(svgText);
               return ui;
            }).placeNode(function(nodeUI, pos){
                        nodeUI.attr('transform', 
                            'translate(' + 
                                  (pos.x - nodeSize/2) + ',' + (pos.y - nodeSize/2) + 
                            ')');
                    });

            var layout = Viva.Graph.Layout.forceDirected(graph);

        // Step 3. Render the graph.
        var renderer = Viva.Graph.View.renderer(graph,
        	   {
        	   	graphics : graphics,
              layout : layout,
        	   	container  : this.el
        	   });
        renderer.run();
  }

});
