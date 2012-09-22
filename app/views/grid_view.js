var View = require('./view');
var template = require('./templates/grid');

module.exports = View.extend({


  template:template,
  
  getRenderData : function() {},

  afterRender: function() {
    this.$el.addClass('row');
  },

  renderGrid : function(){
	// /svc/data/analysis/feature_matrices/2012_09_18_0835__cons
	d3.tsv("/svc/data/analysis/feature_matrices/2012_09_18_0835__cons", function(data) {
		console.log(data[0]);
		console.log(data[1]);
	});
  }


});
