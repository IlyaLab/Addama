var Layout = Backbone.Model.extend({
    defaults: {
        nodes: [],
        edges: []
    },

    url:function () {
        return "svc" + this.get("uri");
    },

    parse: function(graphData) {
        var node_data = {};
        _.each(_.keys(graphData), function(a) {
            if (a === "adj" || a === "iByn") return;
            node_data[a] = _.clone(graphData[a]);
        });

        node_data.label = node_data.nByi.map(function(f) {
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
            .map(function(row) {
                var obj = {};
                for (var i = 0; i < key_len; i++) {
                    obj[data_keys[i]] = node_data[data_keys[i]][row];
                }
                return obj;
            });

        var edges = graphData.adj.map(function(edge) {
            return { source:edge[1], target:edge[0],weight:edge[2]};
        });

        return { "nodes": nodes, "edges": edges };
    }
});

var Layouts = Backbone.Model.extend({
    model: Layout,

    url: function() {
        return "svc" + this.get("uri");
    },

    parse: function(json) {
        var _this = this;
        var layouts = _.map(json.files, function(f) {
            var l = new Layout(f, _this.options);
            l.fetch({ async: false });
            return l;
        });
        return { "layout": layouts };
    }
});

module.exports = Backbone.Model.extend({
    model: Layouts,

    url:function () {
        var dataset_id = this.get("dataset_id");
        return this.get("data_uri").replace(dataset_id, "layouts/" + dataset_id);
    },

    parse:function (json) {
        var _this = this;
        var layouts = _.map(json.directories, function(layoutDir) {
            var layout = _this.get("model_unit").layouts[layoutDir.label];
            var l = new Layouts(_.extend({}, layout, layoutDir, _this.options));
            l.fetch({ async: false });
            return l;
        });
        return { "layouts": layouts }
    },

    getNodesArray : function() {
        return _.first(_.first(this.get("layouts")).get("layout")).get("nodes");
    },

    getEdgesArray : function() {
        return _.first(_.first(this.get("layouts")).get("layout")).get("edges");
    }

});
