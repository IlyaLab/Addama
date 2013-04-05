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

        var panelSpacing = 20;
        var heightBw = 3;
        var barMargin = 10;
        var backgroundColor = "lightgray";
        if (_.has(this.options.annotations, "panelSpacing")) panelSpacing = this.options.annotations.panelSpacing;
        if (_.has(this.options.annotations, "height")) heightBw = this.options.annotations.height;
        if (_.has(this.options.annotations, "barMargin")) barMargin = this.options.annotations.barMargin;
        if (_.has(this.options.annotations, "backgroundColor")) backgroundColor = this.options.annotations.backgroundColor;

        this.$el.html(Template({ "nodetypes": nodetypes, "legends": legends }));
        this.$el.find(".node-info").css({ "margin-bottom": panelSpacing });
        this.$el.find(".node-info").css({ "background-color": backgroundColor });
        this.$el.find(".node-measures").css({ "height": heightBw, "margin": barMargin });

        _.each(this.$el.find(".node-measures"), this.renderBar, this);

        this.renderConnections();

        this.$el.find(".minigraph-legend").draggable();
    },

    renderBar: function (el) {
        $(el).empty();

        var barHeight = 15;
        if (_.has(this.options.annotations, "barHeight")) barHeight = this.options.annotations.barHeight;

        var datakey = $(el).data("key");
        var datavalue = $(el).data("value");
        var colormap = this.options.annotations.colors || {};
        var datacolor = colormap[datakey] || this.defaultColor;

        var svg = d3.select(el)
            .append("svg")
            .attr("height", barHeight)
            .style("margin-left", 10)
            .style("shape-rendering", "crispEdges");

        svg.selectAll("rect")
            .data([datavalue])
            .enter()
            .append("rect")
            .attr("y", 0)
            .attr("width", d3.scale.linear().domain([0, 1]).range([0, 100]))
            .attr("height", barHeight)
            .style("stroke", datacolor)
            .style("fill", datacolor)
            .append("svg:title")
            .text(datakey + " " + datavalue);
    },

    renderConnections: function () {
        var lineWidth = 2;
        if (_.has(this.options.annotations, "lineWidth")) lineWidth = this.options.annotations.lineWidth;

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