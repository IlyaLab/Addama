var TopNavBar = require('../views/topbar_view');

Controller = {

	app : {
		layout : function() {
			var topnavbar = new TopNavBar();
			$('#navigation-container').append(topnavbar.render().el);
		}
	},

	graph : {
		view : function() {
			var GraphView = require('../views/graph_view');
			var graphView = new GraphView();
			 	$('#mainDiv').html(graphView.render().el);
    			graphView.renderGraph();
		}
	},

	twod : {
		view : function() {
			var TwoD = require('../views/2D_Distribution_view');
			var twoDView = new TwoD();
			$('#mainDiv').html(twoDView.render().el);
		}
	},

	home : {
		view : function() {
			var HomeView = require('../views/home_view');
			var homeView = new HomeView();
			$('#mainDiv').html(homeView.render().el);
		}	
	},

};

module.exports = Controller;