var Layout = Backbone.Model.extend({
    defaults:{
        nodes:[],
        edges:[]
    },

    initialize: function() {
        _.bindAll(this, "url", "parse", "filterNodes", "filterEdgesByNodes");
    },

    url:function () {
        return "svc" + this.get("uri");
    },

    parse:function (graphData) {
        var node_data = {};
        _.each(_.keys(graphData), function (a) {
            if (a === "adj" || a === "iByn") return;
            node_data[a] = _.clone(graphData[a]);
        });

        node_data.label = node_data.nByi.map(function (f) {
            var lbl = qed.Lookups.Labels[f];
            if (lbl) {
                if (_.isString(lbl)) return lbl;
                if (lbl.label) return lbl.label;
            }
            return f;
        });

        node_data.feature_id = node_data.nByi;

        var data_keys = _.keys(node_data);
        var key_len = data_keys.length;

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

        return { "nodes":nodes, "edges":edges };
    },

    filterNodes:function (nodes) {
        console.log("filterNodes");
        if (!this.all_node_index) {
            this.all_node_index = {};
            this.all_nodes = this.get("nodes");
            this.all_edges = this.get("edges");

            var nodeIdx = this.all_node_index;
            _.each(this.get("nodes"), function (node, idx) {
                nodeIdx[node.feature_id] = {idx:idx, edge_arr:[]};
            });
            _.each(this.get("edges"), function (edge, idx) {
                nodeIdx[nodes[edge['source']].feature_id].edge_arr.push(idx);
                nodeIdx[nodes[edge['target']].feature_id].edge_arr.push(idx);
            });
        }


        this.current_node_index = {};

        var _this = this;
        _.each(nodes, function (node, idx) {
            _this.current_node_index[node.feature_id] = {idx:idx, edge_arr:[]};
        });

        var edges = this.filterEdgesByNodes(nodes);

        this.set("nodes", nodes);
        this.set("edges", edges);
        this.trigger('reset');
    },

    filterEdgesByNodes:function (nodes) {
        var _this = this;

        var edge_helper = _.map(_.range(this.all_edges.length), function () { return 0; });

        var keepers = [];
        _.each(_.pluck(nodes, 'feature_id'), function (label) {    //for each node that we're keeping
            _.each(_this.all_node_index[label].edge_arr, function (edge_idx) {  //find all of its edges
                if (++edge_helper[edge_idx] === 2) {
                    keepers.push(_this.all_edges[edge_idx]);
                }
            });
        });

        return keepers.map(function (edge) {
            return {
                source:_this.current_node_index[_this.all_nodes[edge.source].feature_id].idx,
                target:_this.current_node_index[_this.all_nodes[edge.target].feature_id].idx,
                weight:edge.weight
            };
        });
    }
});

var Layouts = Backbone.Model.extend({
    model:Layout,

    url:function () {
        return "svc" + this.get("uri");
    },

    parse:function (json) {
        var _this = this;
        var layouts = _.map(json.files, function (f) {
            var l = new Layout(f, _this.options);
            l.fetch({ async:false });
            return l;
        });
        return { "layout":layouts };
    }
});

module.exports = Backbone.Model.extend({
    model:Layouts,

    url:function () {
        var dataset_id = this.get("dataset_id");
        return this.get("data_uri").replace(dataset_id, "layouts/" + dataset_id);
    },

    parse:function (json) {
        var _this = this;
        var layouts = _.map(json.directories, function (layoutDir) {
            var layout = _this.get("model_unit").layouts[layoutDir.label];
            var l = new Layouts(_.extend({}, layout, layoutDir, _this.options));
            l.fetch({ async:false });
            return l;
        });
        return { "layouts":layouts }
    }
});
