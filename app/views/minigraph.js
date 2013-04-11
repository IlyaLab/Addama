var Template = require("../templates/minigraph");

module.exports = Backbone.View.extend({
    defaultColor: "#4682B4",
    barscale: d3.scale.linear().domain([0, 1]).range([0, 80]),

    events: {
        "click .color-picker": function (e) {
            var colorpicker = $(e.target);
            var keycode = colorpicker.data("key");
            var nodemeasures = this.$el.find(".node-measures");

            new Color.Picker({
                color: this.defaultColor,
                display: true,
                autoclose: true,
                size: 200,
                callback: function (rgba) {
                    var newcode = "#" + Color.Space(rgba, "RGB>STRING");
                    colorpicker.parent().css({ "background-color": newcode });
                    _.each(nodemeasures, function(nodemeasure) {
                        if (_.isEqual($(nodemeasure).data("key"), keycode)) {
                            $(nodemeasure).css({ "background": newcode });
                        }
                    });
                }
            }).toggle(true);
        }
    },

    initialize: function () {
        _.bindAll(this, "renderData");
        this.model.on("load", this.renderData);
        $(window).on("resize", jsPlumb.repaintEverything);
    },

    renderData: function () {
        var colormap = this.getAnnotation("colors", {});
        var legends = _.map(this.model.get("measureKeys"), function (measure_key) {
            return { "color": colormap[measure_key] || this.defaultColor, "label": measure_key };
        }, this);

        _.each(this.model.get("nodesByType"), function(nodesContainer) {
            _.each(nodesContainer.nodes, function(node) {
                _.each(node.measures, function(measure) {
                    measure.color = colormap[measure.key] || this.defaultColor;
                    measure.barlength = Math.round(this.barscale(measure.value));
                }, this);
            }, this);
        }, this);

        this.$el.html(Template({ "nodetypes": this.model.get("nodesByType"), "legends": legends }));
        this.$el.find(".minigraph-legend").draggable();

        this.$el.find(".node-info").css({
            "margin-bottom": this.getAnnotation("panelSpacing", 20),
            "background-color": this.getAnnotation("panelColor", "lightgray")
        });

        this.$el.find(".node-info li").tooltip({});

        this.$el.find(".node-measures").css({
            "margin": this.getAnnotation("barMargin", 2),
            "height": this.getAnnotation("barHeight", 15)
        });

        this.renderConnections();
    },

    renderConnections: function () {
        var jsPlumbConfig = {
            anchors: ["RightMiddle", "LeftMiddle"],
            paintStyle: {
                "lineWidth": this.getAnnotation("lineWidth", 2),
                "strokeStyle": this.getAnnotation("lineColor", "#4212AF")
            },
            endpointStyle: {
                "radius": this.getAnnotation("connectorRadius", 8),
                "fillStyle": this.getAnnotation("connectorFill", "#E79544")
            },
            connector: "Straight",
            isContinuous: true
        };

        var nodesById = _.groupBy(this.model.get("nodes"), "id");
        _.each(this.model.get("edges"), function (edge) {
            var source = _.first(nodesById[edge.source]);
            var target = _.first(nodesById[edge.target]);
            jsPlumb.connect(_.extend(jsPlumbConfig, {source: source.uid, target: target.uid}));
        });
    },

    getAnnotation: function(key, defaultValue) {
        if (this.options && this.options.annotations && _.has(this.options.annotations, key)) return this.options.annotations[key];
        return defaultValue;
    }
});