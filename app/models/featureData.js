var Model = require('./model');

module.exports = Model.extend({

	

	parse: function(response) {
		var feature;
		var data;

		var fields = response.split('\t');
		feature.feature_id = fields[0];

		var alias = response.feature_id.split(':');

		feature.label = response.label || alias[2];
		feature.type = alias[0];
		feature.source = alias[1];

		return {feature: new Feature(feature), data: new RawData(data)};
	}

});