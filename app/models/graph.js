var Model = require('./model');
var FeatureList = require('./featureList');
var EdgeList = require('./edgeList');

module.exports = Model.extend({

	serviceRoot : '/svc',
	serviceRead : '/data',
	serviceDir :'/analysis/layouts',

	url : function() {
		return this.serviceRoot + this.serviceRead + this.serviceDir  + '/'
				+ this.get('analysis_id') + '/' + this.get('dataset_id');
	},

	defaults: {
		edges : new EdgeList(),
		nodes : new FeatureList()
	},

	initialize: function() {
		_.bindAll(this,'getEdgesArray','getNodesArray','url','parse','defaultParameters');
	},

	getEdgesArray : function() {
			return this.get('edges').toJSON();
	},

	getNodesArray : function() {
			return this.get('nodes').toJSON();
	},

	defaultParameters : function() {
			var options = new Object();

			switch ( this.get('analysis_id') ) {
				case('pairwise') :
					_.extend(options, {x:'r1',y:'r2',edgeRouting:'straight'});
				break;
				case('rf-ace') :
				default:
					_.extend(options, {x:'r1',y:'hodge',edgeRouting:'diagonal'});
				break;
			}

			return options;
	},

	parse: function(graphData){

		var node_data = new Object(),
				nodes = new Array(),
			    edges = graphData.adj,
			data_keys = new Array(),
	              obj = new Object(),
	                i = 0;
 		    
	    Object.keys(graphData).forEach(function(a) {  // strip out edges
	        if (a === 'adj' || a ==='iByn')   return;
	        node_data[a] = _.clone(graphData[a]);
	      });

	    node_data.label = node_data.nByi.map(function(f) { return f.split(':')[2];});

	    data_keys = _.keys(node_data);
	    key_len = data_keys.length;
	    
	      //keys of the data structure    
	    nodes = _.range(node_data[data_keys[0]].length)
	             .map(function(row) {
	                    obj={};
	                    for (i=0; i < key_len; i++)  {
	                    	obj[data_keys[i]] = node_data[data_keys[i]][row];
	                    }
	                    return obj;
	            });  

	    edges = edges.map(function(edge) { return { source:edge[1], target:edge[0],weight:edge[2]}; } ); 

			//the returned object is mapped to the model properties ie. this.nodes, this.edges
		return { nodes: new FeatureList(nodes), edges : new EdgeList(edges) };  

	}

});
