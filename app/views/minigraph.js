var Template = require("../templates/minigraph");

module.exports = Backbone.View.extend({
    defaultColor: "#4682B4",
    barscale: d3.scale.linear().domain([0, 1]).range([0, 80]),

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

        var measure_keys = this.model.get("measureKeys");

        var colormap = this.options.annotations.colors || {};
        var legends = _.map(measure_keys, function (measure_key) {
            return { "color": colormap[measure_key] || this.defaultColor, "label": measure_key };
        }, this);

        this.$el.html(Template({ "nodetypes": this.model.get("nodesByType"), "legends": legends }));

        var panelSpacing = 20;
        var panelColor = "lightgray";
        if (_.has(this.options.annotations, "panelSpacing")) panelSpacing = this.options.annotations.panelSpacing;
        if (_.has(this.options.annotations, "panelColor")) panelColor = this.options.annotations.panelColor;
        this.$el.find(".node-info").css({ "margin-bottom": panelSpacing });
        this.$el.find(".node-info").css({ "background-color": panelColor });

        _.each(this.$el.find(".node-measures"), this.renderBar, this);

        this.renderConnections();

        this.$el.find(".minigraph-legend").draggable();
    },

    renderBar: function (el) {
        var barHeight = 15;
        var barMargin = 2;
        if (_.has(this.options.annotations, "barHeight")) barHeight = this.options.annotations.barHeight;
        if (_.has(this.options.annotations, "barMargin")) barMargin = this.options.annotations.barMargin;

        var colormap = this.options.annotations.colors || {};
        var datacolor = colormap[$(el).data("key")] || this.defaultColor;

        $(el).css({
            "padding-right": this.barscale($(el).data("value")),
            "background": datacolor,
            "margin": barMargin,
            "height": barHeight
        });
    },

    renderConnections: function () {
        var lineWidth = 2;
        var lineColor = "#4212AF";
        var connectorRadius = 8;
        var connectorFill = "#E79544";
        if (_.has(this.options.annotations, "lineWidth")) lineWidth = this.options.annotations.lineWidth;
        if (_.has(this.options.annotations, "lineColor")) lineColor = this.options.annotations.lineColor;
        if (_.has(this.options.annotations, "connectorRadius")) connectorRadius = this.options.annotations.connectorRadius;
        if (_.has(this.options.annotations, "connectorFill")) connectorFill = this.options.annotations.connectorFill;

        var jsPlumbConfig = {
            anchors: ["RightMiddle", "LeftMiddle"],
            paintStyle: { "lineWidth": lineWidth, "strokeStyle": lineColor },
            endpointStyle: { "radius": connectorRadius, "fillStyle": connectorFill },
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