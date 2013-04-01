var Template = require("../templates/minigraph");

module.exports = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, "renderData");
        this.model.on("load", this.renderData);
        $(window).on("resize", this.renderData);
    },

    renderData: function () {
        var nodes = this.model.get("nodes");
        _.each(nodes, function (node) {
            node.uid = _.uniqueId("node_");
        });
        var colormap = this.options.annotations.colors || {};
        var nodetypes = _.map(_.groupBy(nodes, "type"), function (group, type) {
            return {
                "label": type,
                "nodes": _.map(group, function (item) {
                    return {
                        "uid": item["uid"],
                        "label": item["id"],
                        "measures": _.map(_.without(_.keys(item), "id", "type", "uid"), function (key) {
                            var color = colormap[key] || "steelblue";
                            return { "label": key, "value": item[key], "color": color };
                        })
                    };
                })
            }
        });

        var nodesById = _.groupBy(nodes, "id");
        this.$el.html(Template({ "nodetypes": nodetypes }));

        _.each(this.$el.find(".node-measures"), this.renderBar);

        this.renderConnections();
    },

    renderBar: function (el) {
        var height = 15;
        var datavalue = $(el).data("value");
        var datacolor = $(el).data("color");

        var svg = d3.select(el)
            .append("svg")
            .attr("height", height)
            .style("margin-left", 10)
            .style("shape-rendering", "crispEdges");

        svg.selectAll("rect")
            .data([datavalue])
            .enter()
            .append("rect")
            .attr("y", 0)
            .attr("width", d3.scale.linear().domain([0, 1]).range([0, 100]))
            .attr("height", height)
            .style("stroke", "white")
            .style("fill", datacolor)
            .append("svg:title")
            .text(function (d) {
                return d;
            });
    },

    renderConnections: function () {
        var jsPlumbConfig = {
            anchors: ["RightMiddle", "LeftMiddle"],
            paintStyle: { lineWidth: 2, strokeStyle: "#4212AF" },
            endpointStyle: { radius: 4 },
            connector: "StateMachine"
        };

        var nodesById = _.groupBy(this.model.get("nodes"), "id");
        _.each(this.model.get("edges"), function (edge) {
            var source = _.first(nodesById[edge.source]);
            var target = _.first(nodesById[edge.target]);
            jsPlumb.connect(_.extend(jsPlumbConfig, {source: source.uid, target: target.uid}));
        });
    }
});