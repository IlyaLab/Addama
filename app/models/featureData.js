var Model = require('./model');

module.exports = Model.extend({

	
	parse : function(response){
		response.label = labels_lookup[response.feature_id] ? labels_lookup[response.feature_id] : response.feature_id;
		return response;
	}

});