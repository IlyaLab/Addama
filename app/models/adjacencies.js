var Model = require('./model');
var FeatureList = require('./featureList');
var EdgeList = require('./edgeList');

module.exports = Model.extend({

    url:function () {
        return this.get("data_uri");
    },

    defaults:{
        edges:new EdgeList(),
        nodes:new FeatureList()
    },

    initialize:function () {
        _.bindAll(this, 'getEdgesArray', 'getNodesArray', 'url', 'parse',
            'filterNodes', 'buildIndexes', 'filterEdgesByNodes',
            'parseTSV', 'parseJSON', 'fetch');
    },

    getEdgesArray:function () {
        return this.get('edges').toJSON();
    },

    getNodesArray:function () {
        return this.get('nodes').toJSON();
    },

    buildIndexes:function () {
        var nodeIdx = this.all_node_index = {};
        var nodes = this.all_nodes = this.original().getNodesArray();
        this.all_edges = this.original().getEdgesArray();
        _.each(nodes, function (node, idx) {
            nodeIdx[node.feature_id] = {idx:idx, edge_arr:[]};
        });

        _.each(this.all_edges, function (edge, idx) {
            nodeIdx[nodes[edge['source']].feature_id].edge_arr.push(idx);
            nodeIdx[nodes[edge['target']].feature_id].edge_arr.push(idx);
        });
    },

    filterEdgesByNodes:function (nodes) {
        var _this = this;
        var keepers = [];
        var node_labels = _.pluck(nodes, 'feature_id');
        var edge_helper = _.map(_.range(this.all_edges.length), function () {
            return 0;
        });  // a list of zeros
        _.each(node_labels, function (label) {    //for each node that we're keeping
            _.each(_this.all_node_index[label].edge_arr, function (edge_idx) {  //find all of its edges
                if (++edge_helper[edge_idx] === 2) {
                    keepers.push(_this.all_edges[edge_idx]);
                }
            });
        });

        var new_edges = keepers.map(function (edge) {
            return {
                source:_this.current_node_index[_this.all_nodes[edge.source].feature_id].idx,
                target:_this.current_node_index[_this.all_nodes[edge.target].feature_id].idx,
                weight:edge.weight
            };
        });
        this.get('edges').reset(new_edges);

    },

    filterNodes:function (nodes) {
        var _this = this;
        if (_.isUndefined(this.all_node_index)) this.buildIndexes();

        this.get('nodes').reset(nodes);
        //build index of current nodes
        this.current_node_index = {};

        _.each(nodes, function (node, idx) {
            _this.current_node_index[node.feature_id] = {idx:idx, edge_arr:[]};
        });

        this.filterEdgesByNodes(nodes);

        this.trigger('reset', nodes);
    },

    parse:function (graphData2) {
        if (_.isEqual(this.get("dataType"), "text")) {
            return this.parseTSV(graphData2);
        }
        return this.parseJSON(graphData2);
    },

    parseTSV:function (graphData) {
        var colHeaders = this.get("column_headers");
        if (!_.isEmpty(colHeaders)) {
            graphData = colHeaders.join("\t") + "\n" + graphData;
        }

        var rows = d3.tsv.parse(graphData);
        var nodes = [];
        var values;
        var node_map = {};
        var edges = _.map(rows, function (row) {
            var feature1 = row[colHeaders[0]];
            var feature2 = row[colHeaders[1]];
            var node1 = {feature_id:feature1, label:qed.Lookups.Labels[feature1] || feature1.split(':')[2]};
            var node2 = {feature_id:feature2, label:qed.Lookups.Labels[feature2] || feature2.split(':')[2]};
            var edge = {};

            var idx = node_map[feature1];
            if (!_.isUndefined(idx)) {
                edge['source'] = idx;
            } else {
                var newNodeIdx = nodes.push(node1) - 1;
                node_map[feature1] = newNodeIdx;
                edge['source'] = newNodeIdx;
            }

            var idx2 = node_map[feature2];
            if (!_.isUndefined(idx2)) {
                edge['target'] = idx2;
            } else {
                var newNodeIdx = nodes.push(node2) - 1;
                node_map[feature2] = newNodeIdx;
                edge['target'] = newNodeIdx;
            }
            edge['weight'] = row[colHeaders[2]];
            return edge;
        });

        return {"nodes":new FeatureList(nodes), "edges":new EdgeList(edges)};
    },

    parseJSON:function (graphData) {
        var node_data = {};

        // strip out edges
        _.each(_.without(_.keys(graphData), "adj", "iByn"), function (a) {
            node_data[a] = _.clone(graphData[a]);
        });

        node_data.label = node_data.nByi.map(function (f) {
            var lbl = qed.Lookups.Labels[f];
            if (lbl) {
                if (_.isString(lbl)) return lbl;
                if (lbl.label) return lbl.label;
            }

            // TODO : This should be agnostic to the types of IDS we use
            var splits = f.split(':');
            if (splits.length) return _.last(splits);
            return f;
        });

        node_data.feature_id = node_data.nByi;

        var data_keys = _.keys(node_data);
        key_len = data_keys.length;

        //keys of the data structure
        var nodes = _.range(node_data[data_keys[0]].length)
            .map(function (row) {
                var obj = {};
                for (var i = 0; i < key_len; i++) {
                    obj[data_keys[i]] = node_data[data_keys[i]][row];
                }
                return obj;
            });

        var edges = graphData.adj.map(function (edge) {
            return { source:edge[1], target:edge[0], weight:edge[2]};
        });

        //the returned object is mapped to the model properties ie. this.nodes, this.edges
        return { nodes:new FeatureList(nodes), edges:new EdgeList(edges) };

    }
//    fetch:function (options) {
//        if (options && options.dataType == "tsv") {
//            return Model.prototype.fetch.call(this, options);
//        }
//        return Model.prototype.fetch.call(this, options);
//    }
});
