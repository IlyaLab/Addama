var View = require('./view');
var template = require('./templates/graph');
var Graph = require('../models/graph');
var TreeChart = require('../vis/treeChart');

module.exports = View.extend({

  tagName: 'div',
  
  getRenderData : function() {},

  afterRender: function() {},

  renderGraph: function() {

  		var treeChart = TreeChart({
  			width:1000, 
  			height:1200, 
  			padding : [20,20,20,20],
  			data:{
  					y: graphData.hodge.map(function(d) { return d;}),
  					x: graphData.r1,
  					labels : graphData.nByi.map(function(f) { return f.split(':')[2];}),
  					edges : graphData.adj
  				}
  		});
  		treeChart(this.$el);
     
  }

});
