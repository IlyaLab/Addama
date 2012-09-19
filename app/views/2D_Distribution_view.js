var View = require('./view');
var template = require('./templates/twod');

module.exports = View.extend({

	plotFunction : null,
	template: template,

	initialize: function() {
		this.render = _.bindAll(this, 'render', 'afterRender','createScatterplot','createKDEplot','createCubbhole');
		var f1 = this.model.features[0],
		    f2 = this.model.features[1];
		    function typeCheck(type) {
		    	return type === 'N'? 0 : 1;
		    }

		    switch(typeCheck(f1.type) + typeCheck(f2.type)) {
		    					case 0: //scatterplot
		    						this.plotFunction = this.createScatterplot;
		    					break;    					    						
		    					
		    					case 1:  //kde plot
		    					this.plotFunction = this.createKDEplot;
		    					break;

		    					case(2): //cubbyhole plot
		    					default:
		    						this.plotFunction = this.createCubbyhole;
		    					break;

			}
	},

	afterRender: function() {
		//this.plotFunction.call(this);
	},

	createScatterplot : function() {
		return this.$el.scatterplot;
	},

	createKDEplot : function() {
		return this.$el.kde;
	},

	createCubbyhole : function() {
		return this.$el.cubbyhole;
	}

});