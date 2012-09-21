var TopNavBar = require('../views/topbar_view');

Controller = {
    topnavbar: new TopNavBar(),

	app : {
		layout : function() {
			$('#navigation-container').append(topnavbar.render().el);
            this.topnavbar.initSearchAutocomplete();
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

	pwpv :  {
		view : function() {
			var PwPvView = require('../views/pwpv_view');
			var pwpvView = new PwPvView();
			 	$('.container').html(pwpvView.render().el);
    			pwpvView.renderGraph();
		}
	},

	twod : {
		view : function(label1,label2) {
			var TwoD = require('../views/2D_Distribution_view');
			var FL = require('../models/featureList');

			var fl = new FL({websvc: '/endpoints/filter_by_id?filepath=%2Ffeature_matrices%2F2012_09_18_0835__cons.fm&IDs=',
						feature_list : [label1, label2]});
			var twoDView = new TwoD({collection: fl});
			fl.fetch();
			$('#mainDiv').html(twoDView.render().el);
		}
	},

	oncovis : {
		view : function() {
			var Oncovis = require('../views/oncovis_view');
			var oncovisView = new Oncovis();
			$('#mainDiv').html(oncovisView.render().el);
            oncovisView.initControls();
            oncovisView.renderGraph();

            this.topnavbar.addAutocompleteSource(oncovisView);
		}
	},

	home : {
		view : function() {
			var HomeView = require('../views/home_view');
			var homeView = new HomeView();
			$('#mainDiv').html(homeView.render().el);
		}	
	}


};

module.exports = Controller;