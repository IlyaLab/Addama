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
		_.bindAll(this,'getEdgesArray','getNodesArray','url','parse','defaultParameters'
			,'parseTSV','parseJSON','fetch');
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
				_.extend(options, {x:'r1',y:'hodge',edgeRouting:'diagonal'});
				break;
				default:
					_.extend(options, {x:'x',y:'y',edgeRouting:'diagonal'});
				break;
			}

			return options;
	},

	parse: function(graphData){
		if (!!~this.url().indexOf('tsv')) {
			return this.parseTSV(graphData);
		}
		return this.parseJSON(graphData);

	},

	parseTSV: function(graphData) {
		var rows = d3.tsv.parseRows(graphData);
		var nodes = [];
		var edges = [];
		var node1, node2, values;
		var idx;
		var edge={};
		var node_map = {};
		_.each(rows, function(row) {
			var feature1 = row[0],
			    feature2 = row[1];
			
			var node1 = {feature_id: feature1, label: feature1.split(':')[2] }, 
			    node2 = {feature_id: feature2, label: feature2.split(':')[2] }, 
			     edge = {};

			if (idx = node_map[feature1]) {
				edge['source']=idx;
			} else {
				edge['source'] = node_map[feature1] = (nodes.push(node1) - 1);
			}
			if (idx = node_map[feature2]) {
				edge['target']=idx;
			} else {
				edge['target'] = node_map[feature2] = (nodes.push(node2) - 1);
			}
			edge['weight'] = row[2];
			edges.push(edge);
		});

		return {nodes: new FeatureList(nodes), edges: new Edgelist(edges)};
	},
	parseJSON: function(graphData) {
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

	},
	fetch: function(options) {
		if (!!~this.url().indexOf('tsv')) {
			return Backbone.Model.prototype.fetch.call(this,_.extend({},options,{dataType:'text'}));
		}
		else {
			return Backbone.Model.prototype.fetch.call(this, options);
		}
	}
});
