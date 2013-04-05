var Template = require("../templates/minigraph");

module.exports = Backbone.View.extend({
    defaultColor:"#4682B4",

    events: {
        "click .color-picker": function (e) {
            var colorpicker = $(e.target);

            var colormap = this.options.annotations.colors;
            if (!colormap) colormap = this.options.annotations.colors = {};

            var renderBar = this.renderBar;
            var nodemeasures = this.$el.find(".node-measures");

            new Color.Picker({
                color: this.defaultColor,
                display: true,
                autoclose: true,
                size: 200,
                callback: function (rgba) {
                    var newcode = "#" + Color.Space(rgba, "RGB>STRING");
                    colormap[colorpicker.data("key")] = newcode;
                    colorpicker.parent().css({ "background-color": newcode });
                    _.each(nodemeasures, renderBar);
                }
            }).toggle(true);
        }
    },

    initialize: function () {
        _.bindAll(this, "renderData", "renderBar");
        this.model.on("load", this.renderData);
        $(window).on("resize", jsPlumb.repaintEverything);
    },

    renderData: function () {
        var nodes = this.model.get("nodes");
        _.each(nodes, function (node) {
            node.uid = _.uniqueId("node_");
        });

        var measure_keys = [];
        var nodetypes = _.map(_.groupBy(nodes, "type"), function (group, type) {
            return {
                "label": type,
                "nodes": _.map(group, function (item) {
                    return {
                        "uid": item["uid"],
                        "label": item["id"],
                        "measures": _.map(_.without(_.keys(item), "id", "type", "uid"), function (key) {
                            measure_keys.push(key);
                            return { "key": key, "value": item[key] };
                        }, this)
                    };
                }, this)
            }
        }, this);

        var colormap = this.options.annotations.colors || {};
        var legends = _.map(colormap, function (color, label) {
            return { "color": color, "label": label }
        });
        _.each(_.difference(_.uniq(measure_keys), _.keys(colormap)), function (missing) {
            legends.push({ "color": this.defaultColor, "label": missing })
        }, this);

        this.$el.html(Template({ "nodetypes": nodetypes, "legends": legends }));
        this.$el.find(".node-info").css({
            "margin-bottom": this.options.annotations.panelSpacing || 20
        });

        _.each(this.$el.find(".node-measures"), this.renderBar, this);

        this.renderConnections();

        this.$el.find(".minigraph-legend").draggable();
    },

    renderBar: function (el) {
        $(el).empty();

        var barheight = this.options.annotations.barheight || 15;
        var datakey = $(el).data("key");
        var datavalue = $(el).data("value");
        var colormap = this.options.annotations.colors || {};
        var datacolor = colormap[datakey] || this.defaultColor;

        var svg = d3.select(el)
            .append("svg")
            .attr("height", barheight)
            .style("margin-left", 10)
            .style("shape-rendering", "crispEdges");

        svg.selectAll("rect")
            .data([datavalue])
            .enter()
            .append("rect")
            .attr("y", 0)
            .attr("width", d3.scale.linear().domain([0, 1]).range([0, 100]))
            .attr("height", barheight)
            .style("stroke", datacolor)
            .style("fill", datacolor)
            .append("svg:title")
            .text(datakey + " " + datavalue);
    },

    renderConnections: function () {
        var lineWidth = this.options.annotations.lineWidth || 2;
        var jsPlumbConfig = {
            anchors: ["RightMiddle", "LeftMiddle"],
            paintStyle: { "lineWidth": lineWidth, "strokeStyle": "#4212AF" },
            endpointStyle: { "radius": 8, "fillStyle": "#E79544" },
            connector: "Straight",
            isContinuous: true
        };

        var nodesById = _.groupBy(this.model.get("nodes"), "id");
        _.each(this.model.get("edges"), function (edge) {
            var source = _.first(nodesById[edge.source]);
            var target = _.first(nodesById[edge.target]);
            jsPlumb.connect(_.extend(jsPlumbConfig, {source: source.uid, target: target.uid}));
        });
    }
});