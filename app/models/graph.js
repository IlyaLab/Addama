var Model = require('./model');
var FeatureList = require('./featureList');
var EdgeList = require('./edgeList');

module.exports = Model.extend({

	url : function() {
        // TODO : Determine this from the corresponding entry in data model
		return "svc/data/analysis/" + this.get('analysis_id') + '/' + this.get('dataset_id');
	},

	defaults: {
		edges : new EdgeList(),
		nodes : new FeatureList()
	},

	initialize: function() {
		_.bindAll(this,'getEdgesArray','getNodesArray','url','parse','defaultParameters',
			'filterNodes','buildIndexes','filterEdgesByNodes',
			'parseTSV','parseJSON','fetch');
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

	buildIndexes: function() {
		var me = this;
			var nodeIdx = this.all_node_index = new Object();
			var nodes = this.all_nodes = this.original().getNodesArray();
			this.all_edges = this.original().getEdgesArray();
			_.each(nodes,function(node,idx){
				nodeIdx[node.feature_id]={idx:idx, edge_arr: []};
			});

			_.each(this.all_edges,function(edge,idx){
				nodeIdx[nodes[edge['source']].feature_id].edge_arr.push(idx);
				nodeIdx[nodes[edge['target']].feature_id].edge_arr.push(idx);
			});

	},

	filterEdgesByNodes: function(nodes) {
			var me = this;
			var keepers = [];
			var node_labels = _.pluck(nodes,'feature_id');
			var edge_helper = _.map(_.range(this.all_edges.length),function(){ return 0;});  // a list of zeros
			_.each(node_labels,function(label) {	//for each node that we're keeping
				 _.each(me.all_node_index[label].edge_arr,function (edge_idx) {  //find all of its edges
				 		if (++edge_helper[edge_idx] === 2) { keepers.push(me.all_edges[edge_idx]);}
				 });
			});

			var new_edges = keepers.map(function(edge) { 
				return {
					source:me.current_node_index[me.all_nodes[edge.source].feature_id].idx,
					target:me.current_node_index[me.all_nodes[edge.target].feature_id].idx,
					weight: edge.weight
				};
			});
			this.get('edges').reset(new_edges);

	},

	filterNodes: function(nodes) {
			var me = this;			
			if (_.isUndefined(this.all_node_index)) this.buildIndexes();

			this.get('nodes').reset(nodes);
			//build index of current nodes
			this.current_node_index = new Object();

			_.each(nodes,function(node,idx){
				me.current_node_index[node.feature_id]={idx:idx, edge_arr: []};
			});

			this.filterEdgesByNodes(nodes);

			this.trigger('reset',nodes);
	},

	parse: function(graphData){
		if (!!~this.get('dataset_id').indexOf('.tsv')) {
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
		var lookup = labels_lookup;
		_.each(rows, function(row) {
			var feature1 = row[0],
			    feature2 = row[1];
			    var lookup = qed.Lookups.Labels;
			var node1 = {feature_id: feature1, label: lookup[feature1]  || feature1.split(':')[2]}, 
			    node2 = {feature_id: feature2, label: lookup[feature2] || feature2.split(':')[2]}, 
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
           var lookup = labels_lookup;
 		    
	    Object.keys(graphData).forEach(function(a) {  // strip out edges
	        if (a === 'adj' || a ==='iByn')   return;
	        node_data[a] = _.clone(graphData[a]);
	      });

	    node_data.label = node_data.nByi.map(function(f) {
            var lbl = lookup[f];
            if (lbl) {
                if (_.isString(lbl)) return lbl;
                if (lbl.label) return lbl.label;
            }

            var splits = f.split(':');
            if (splits.length) return _.last(splits);
            return f;
        });

	    node_data.feature_id = node_data.nByi;

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
			return Model.prototype.fetch.call(this,_.extend({},options,{dataType:'text'}));
		}
		else {
			return Model.prototype.fetch.call(this, options);
		}
	}
});
