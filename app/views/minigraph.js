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

    processVerticalLocations: function(nodes) {
        var defaultSpacing = 100;

        if (nodes.length < 0) {
            return;
        }

        _.chain(nodes)
            .groupBy('type')
            .each(function(groupData, typeKey) {
                var curY = 0;

                _.each(groupData, function(node) {
                    if (_.has(node, '_yloc')) {
                        curY = node['_yloc'];
                    }
                    else {
                        curY += defaultSpacing;
                    }

                    node['_top'] = curY;
                });
            });
    },

    renderData: function () {
        var colormap = this.getAnnotation("colors", {}),
            columnOffsets = this.getAnnotation("columnOffsets", {
                Gene: 1,
                Pathway: 1,
                Hallmark: 1
            }),
            nodeWidths = this.getAnnotation("nodeWidths", {
                Gene: 200,
                Pathway: 200,
                Hallmark: 200
            });

        var legends = _.chain(this.model.get("measureKeys"))
            .without("_yloc")
            .map(function (measure_key) {
                return { "color": colormap[measure_key] || this.defaultColor, "label": measure_key };
            }, this)
            .value();

        this.processVerticalLocations(this.model.get("nodes"));

        _.each(this.model.get("nodes"), function(node) {
            node.measures = _.map(_.without(_.keys(node), "id", "type", "_yloc", "_top"), function(key) {
                return {
                    "key": key,
                    "value": node[key],
                    "color": colormap[key] || this.defaultColor,
                    "barlength": Math.round(this.barscale(node[key]))
                }
            }, this);
            node.uid = _.uniqueId("node_");
        }, this);

        var nodesByType = _.groupBy(this.model.get("nodes"), "type");

        _.each(nodesByType, function(nodeData, typeKey) {
            nodeData.width = nodeWidths[typeKey];
            nodeData.offset =  columnOffsets[typeKey];
        });

        this.$el.html(Template({
            "nodesByType": nodesByType,
            "legends": legends
        }));

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