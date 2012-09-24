var Model = require('./model');

module.exports = Model.extend({

	
	parse : function(response){
		response.label = qed.labels[response.feature_id] ? qed.labels[response.feature_id] : response.feature_id;
		return response;
	}

});