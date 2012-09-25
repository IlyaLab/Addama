// Base class for all collections.
module.exports = Backbone.Collection.extend({
  
  original_collection : new Backbone.Collection(),

original: function(value) {
  		if (!arguments.length) return this.original_collection;
		    this.original_collection = value;
	    return this;
	}
});
