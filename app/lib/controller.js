Controller = {
	testwindow : {
		view : function() {
			var WinView = require('../views/window_view');
			var winView = new WinView();
			$('#mainDiv').html(winView.render().el);			
		}
	},

	grid : {
		view : function() {
			var GridView = require('../views/grid_view');
			var gridView = new GridView();
			$('#mainDiv').html(gridView.render().el);
			gridView.renderGrid();
		}
	},

	app : {
		layout : function() {
			var TopNavBar = require('../views/topbar_view');
			var topnavbar = new TopNavBar();
			$('#navigation-container').append(topnavbar.render().el);
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
			var fl = new FL({
						websvc: '/endpoints/filter_by_id?filepath=%2Ffeature_matrices%2F2012_09_18_0835__cons.fm&IDs=',
						feature_list : [label1, label2]
					});
			var twoDView = new TwoD({collection: fl});
			fl.fetch();
			$('#mainDiv').html(twoDView.render().el);
		}
	},

	oncovis : {
		view : function() {
			var Oncovis = require('../views/oncovis_view');
    		var oncovisView =  new Oncovis();
			$('#mainDiv').html(oncovisView.render().el);
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

			var arg_array = remainder.length ? remainder.split('/') : [],
					  len = arg_array.length,
			     features = arg_array.slice(0,len-1),
			     Model,  model,
			     vis_type = '';

			   if(len > 0 ) { //if there's param (even an empty one)
			     	vis_type = arg_array[len-1];
			     }

			//graph based analysis
			if ( _(['rf-ace','mds','pairwise']).contains(analysis_type) ) { 
				vis_type = vis_type || 'graph';
				if ( len <= 2 ) {  // 1 or no parameters.  just draw vis of analysis
					Model = require('../models/graph');
					model = new Model({analysis_id : analysis_type, dataset_id : dataset_id});
				}
				else {
					Model = require('../models/featureList');
					model = new Model({analysis_id : analysis_type, dataset_id : dataset_id, features: features});
				}

			} else if ( analysis_type === 'information_gain' ) {
				Model = require('../models/genomic_featureList');
					model = new Model({analysis_id : analysis_type, dataset_id : dataset_id });			

			} else {  //tabular data like /feature_matrix/data_freeze_3 or information gain
				vis_type = vis_type || 'grid';  //or parcoords?
				if ( len <= 2 ) {  // 1 or no parameters.  just draw vis of analysis
					 Model = require('../models/featureMatrix');
					 model = new Model({analysis_id : analysis_type, dataset_id : dataset_id});
				}
				else {
					Model = require('../models/featureMatrix');
					model = new Model({analysis_id : analysis_type, dataset_id : dataset_id, features: features});
				}
			}

			model.fetch({
				success : function(model,resp) {
					var memory_model;
					if (Model.prototype.add) {
						memory_model = new Model({analysis_id : analysis_type, dataset_id : dataset_id});
						memory_model.add(model.toJSON(),{silent:true});
					} else {
							memory_model = new Model(model.toJSON());
					}
					memory_model.original(model);
					Controller.vis[vis_type](memory_model);
				}
			});
	},

	vis : {
			'graph' : function(model) {			
						var GraphView = require('../views/graph_view');
						var graphView = new GraphView({model:model});
						 	$('#mainDiv').html(graphView.render().el);
		  			},
		  	'grid' : function(model) {			
						var GridView = require('../views/grid_view');
						var gridView = new GridView({collection:model});
						 	$('#mainDiv').html(gridView.render().el);
		  			},
			'circ'	: function(model) {
						var CircView = require('../views/circ_view');
						var circView = new CircView({model:model});
						$('#mainDiv').html(circView.render().el);
			},
			'twoD'	: function(model) {},
			'kde'	: function(model) {},
			'parcoords' :function(model) {},
			'heat' : function(model) {
						var Oncovis = require('../views/oncovis_view');
	    				var oncovisView =  new Oncovis({model:model});
						$('#mainDiv').html(oncovisView.render().el);
			}
	}
};

module.exports = Controller;