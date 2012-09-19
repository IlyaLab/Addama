var View = require('./view');
var template = require('./templates/graph');
var Graph = require('../models/graph');
var TreeChart = require('../vis/treeChart');
var PC = require('./parcoords_view');

module.exports = View.extend({


  template:template,
  
  getRenderData : function() {},

  afterRender: function() {
    this.$el.addClass('row');
  },

  renderGraph: function() {

  		var treeChart = TreeChart({
  			width:800, 
  			height:600, 
  			padding : [10,10,10,10],
  			data:{
  					y: graphData.hodge.map(function(d) { return d;}),
  					x: graphData.r1,
  					labels : graphData.nByi.map(function(f) { return f.split(':')[2];}),
  					edges : graphData.adj
  				}
  		});
  		treeChart(this.$el.find('.graph-container'));
      var filter = this.$el.find('.filter-container');
      var pc_view = new PC();
      filter.html(pc_view.render().el);
      pc_view.showData();
     
  }

});
