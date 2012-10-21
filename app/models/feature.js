var Node = require('./node');

module.exports = Node.extend({

	defaults: {
		type: '',
		source: '',
		label: '',
		feature_id: ''
	},

	parse: function(response) {
		var lookup = labels_lookup;

		var data = response.split(':');

		response.label = response.label || lookup[data[2]];
		response.type = data[0];
		response.source = data[1];

		return response;
	}

});