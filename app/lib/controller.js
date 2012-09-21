var TopNavBar = require('../views/topbar_view');
var Oncovis = require('../views/oncovis_view');

Controller = {
    topnavbar: new TopNavBar(),
    oncovisView: new Oncovis(),

	app : {
		layout : function() {
			$('#navigation-container').append(Controller.topnavbar.render().el);
            Controller.topnavbar.initSearchAutocomplete();
            Controller.topnavbar.addAutocompleteSource(Controller.oncovisView);
		}
	},

	graph : {
		view : function() {
			var GraphView = require('../views/graph_view');
			var graphView = new GraphView();
			 	$('#mainDiv').html(graphView.render().el);
		}
	},

	pwpv :  {
		view : function() {
			var PwPvView = require('../views/pwpv_view');
			var pwpvView = new PwPvView();
			 	$('#mainDiv').html(pwpvView.render().el);
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
			$('#mainDiv').html(Controller.oncovisView.render().el);
            Controller.oncovisView.initControls();
            Controller.oncovisView.renderGraph();
		}
	},

	home : {
		view : function() {
			var HomeView = require('../views/home_view');
			var homeView = new HomeView();
			$('#mainDiv').html(homeView.render().el);
		}	
	},

	route_analysis: function(analysis_type, dataset_id, remainder) {

			var arg_array = remainder.split('/'),
					  len = arg_array.length,
			     features = arg_array.slice(0,len-1),
			     Model,  model,
			     vis_type = 'grid';  //dummy default
			
			//graph based analysis
			if ( _(['rf_ace','mds','pwpv']).contains(analysis_type) ) { 
				vis_type = len > 0 ? arg_array[len-1] : 'graph';

				if ( len <= 1 ) {  // 1 or no parameters.  just draw vis of analysis
					Model = require('../models/graph');
					model = new Model({analysis_id : analysis_type, dataset_id : dataset_id});
				}
				else {
					Model = require('../models/featureList');
					model = new Model({analysis_id : analysis_type, dataset_id : dataset_id, features: features});
				}
			}

			else {  //tabular data like /feature_matrix/data_freeze_3 or information gain
				vis_type = len > 0 ? arg_array[len-1] : 'grid';  //or parcoords?

				if ( len <= 1 ) {  // 1 or no parameters.  just draw vis of analysis
					 Model = require('../models/table');
					 model = new Model({analysis_id : analysis_type, dataset_id : dataset_id});
				}
				else {
					Model = require('../models/featureList');
					model = new Model({analysis_id : analysis_type, dataset_id : dataset_id, features: features});
				}
			}

			Controller.vis[vis_type](model);
	},

	vis : {
			'graph' : function(model) {			
						var GraphView = require('../views/graph_view');
						var graphView = new GraphView({model:model});
						 	$('#mainDiv').html(graphView.render().el);
		  			},
			'circ'	: function(model) {},
			'twoD'	: function(model) {},
			'kde'	: function(model) {},
			'parcoords' :function(model) {},
			'heat' : function(model) {}
	}
};

module.exports = Controller;