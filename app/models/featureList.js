var Collection = require('./collection');
var Feature = require('./feature')

module.exports = Collection.extend({
	model:Feature,

	url : function() {
		return this.websvc + this.feature_list.join(',');
	},

	initialize: function(options) {
		options || (options = {});
		this.feature_list = options.feature_list;
		this.websvc = options.websvc;

	},

	parse: function(response){
		var response_array = response.split('\n');
		var headers = response_array[0].split('\t');
		var feature_array = _rest(response_array,1);
		var features = feature_array.map(function(f) { 
				var cols = f.split('\t');
				return { 
						label : cols[0],
						values : _rest(cols,1)
					}
			});

	}

});