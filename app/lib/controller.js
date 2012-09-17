var GraphView = require('../views/graph_view');
var HomeView = require('../views/home_view');


Controller = {

	home : {
		view : function() {
			var homeView = new HomeView();
			$('body').html(homeView.render().el);
		},
	},
	graph : {
		view : function() {
			var graphView = new GraphView();
			 	$('body').html(graphView.render().el);
    			graphView.renderGraph();
		}
	}
};

module.exports = Controller;