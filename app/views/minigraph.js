var Template = require("../templates/minigraph");

module.exports = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, "renderData");
        this.model.on("load", this.renderData);
    },

    renderData: function () {
        var nodes = this.model.get("nodes");
        _.each(nodes, function (node) {
            node.uid = _.uniqueId("node_");
        });
        var grouped = _.groupBy(nodes, "type");
        var nodetypes = _.map(grouped, function (group, type) {
            return {
                "label": type,
                "nodes": _.map(group, function (item) {
                    return {
                        "uid": item["uid"],
                        "label": item["id"],
                        "measures": _.map(_.without(_.keys(item), "id", "type", "uid"), function (key) {
                            return { "label": key, "value": item[key] }
                        })
                    };
                })
            }
        });

        var nodesById = _.groupBy(nodes, "id");
        this.$el.html(Template({ "nodetypes": nodetypes }));

        var jsPlumbConfig = {
            anchors: ["RightMiddle", "LeftMiddle"],
            paintStyle: { lineWidth: 2, strokeStyle: "#4212AF" },
            endpointStyle: { radius: 4 },
            connector: "StateMachine"
        };
        var edges = this.model.get("edges");
        _.each(edges, function (edge) {
            var source = _.first(nodesById[edge.source]);
            var target = _.first(nodesById[edge.target]);
            jsPlumb.connect(_.extend(jsPlumbConfig, {source: source.uid, target: target.uid}));
        });
    }
});