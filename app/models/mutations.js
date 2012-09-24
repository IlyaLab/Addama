var Model = require('./model');

module.exports = Model.extend({

	serviceRoot : 'svc',
	serviceRead : '/data',
	serviceDir :'/analysis/mutations',

	url : function() {
		return this.serviceRoot + this.serviceRead + this.serviceDir + '/' + this.get('dataset_id');
	}

});