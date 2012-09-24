var application = require('application');

$(function() {
	qed = _.extend(qed,{app: application});
   	application.initialize();
	Backbone.history.start();    
});
