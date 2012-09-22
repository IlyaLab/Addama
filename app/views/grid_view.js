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
	var container = this.$el.find(".grid-container");
	d3.tsv("/svc/data/analysis/feature_matrices/2012_09_18_0835__cons", function(data) {
		var grid;
		var columns = [];

		for(var i in data[0]) if (data[0].hasOwnProperty(i))
		{
			columns.push({id: i, name: i, field: i, sortable: true});
		}
		console.log(data);
		console.log(columns);


		var options = {
			enableCellNavigation: false,
			enableColumnReorder: false
		};
		grid = new Slick.Grid(container, data, columns, options);
		
	});
  }


});
