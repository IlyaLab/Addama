var View = require('./view');
var template = require('./templates/graph');
var Graph = require('../models/graph');

module.exports = View.extend({

  tagName: 'div',
  model: new Graph,
  
  getRenderData : function() { return {'container':'graph'};},

  afterRender: function() {},

  renderGraph: function() {

         var graph = Viva.Graph.graph();

            // Step 2. We add nodes and edges to the graph:
            graph.addLink(1, 2);

            /* Note: graph.addLink() creates new nodes if they are not yet 
               present in the graph. Thus calling this method is equivalent to:

               graph.addNode(1);
               graph.addNode(2);
               graph.addLink(1, 2);
            */

            // Step 3. Render the graph.
            var renderer = Viva.Graph.View.renderer(graph,
            	   {
            	   	graphics : Viva.Graph.View.svgGraphics(),
            	   	container  : this.el,
            	   });
            renderer.run();
  }

});
