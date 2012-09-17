var application = require('application');

$(function() {
	qed = {};
	qed.app = application;
 	qed.app.initialize();
 	Backbone.history.start({pushState:true});
});
