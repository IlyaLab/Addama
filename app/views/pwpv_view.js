var View = require('./view');
var template = require('./templates/pwpv');
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
  					y: pwpvData.r2,
  					x: pwpvData.r1,
  					labels : pwpvData.nByi.map(function(f) { return f.split(':')[2];}),
  					edges : pwpvData.adj
  				}
  		});
  		treeChart(this.$el.find('.pwpv-container'));
     
     
  }

});
