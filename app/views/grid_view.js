var View = require('./view');
var template = require('./templates/grid');
var FeatureMatrix = require('../models/featureMatrix');

module.exports = View.extend({

  model:FeatureMatrix,
  template:template,

  initialize : function() {
  	_.bindAll(this, 'getRenderData', 'afterRender', 'renderGrid');
  },
  
  getRenderData : function() {},

  afterRender: function() {
  	var _this = this;
    this.$el.addClass('row-fluid');
    this.model.fetch().done(_this.renderGrid);
  },

  renderGrid : function(){
	var container = this.$el.find(".grid-container");
		var grid,
		    columns = [];

		_.each(this.model.getHeaders(), function(i) {
			columns.push({id: i, name: i, field: i, sortable: true});
		});

		var options = {
			enableCellNavigation: false,
			enableColumnReorder: false
		};
		grid = new Slick.Grid(container, this.model.toJSON(), columns, options);
		
	}

});