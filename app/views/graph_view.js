var View = require('./view');
var template = require('./templates/graph');
var Graph = require('../models/graph');
var TreeChart = require('../vis/treeChart');
var PC = require('./parcoords_view');

module.exports = View.extend({


  template:template,
  
  getRenderData : function() {},

  afterRender: function() {
    this.$el.addClass('row-fluid');
  },

  renderGraph: function() {
    var parentDiv = this.$el.find('.graph-container'),
    w= parentDiv.width(),
    h= parentDiv.height();

    graphData.labels = graphData.nByi.map(function(f) { return f.split(':')[2];});
    var adj = graphData.adj;
    delete graphData.adj;
  		var treeChart = TreeChart({
  			width:w, 
  			height:h,   			
  			nodes:{
            data : graphData,
  					y: 'hodge',
  					x: 'r1'				
  				},
          edges: {
            data: adj
          }
  		});
  		treeChart(parentDiv);
      var filter = this.$el.find('.filter-container');
      var pc_view = new PC();
      filter.html(pc_view.render().el);
      pc_view.showData();

      Backbone.Mediator.subscribe('dimension:select',dimension_selected, this, false );

      function dimension_selected(dimension) {
        var scale = d3.scale.linear().domain([d3.extent(graphData[dimension])]).range([0.2,0.8]);
        treeChart.nodeOpacity(function(node) { return scale(node[dimension]);})
        treeChart.redraw();
      }
     
  }

});
