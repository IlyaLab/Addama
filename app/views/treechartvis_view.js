var Feature = require('../models/feature');
var Edge = require("../models/edge");
var TreeChart = require('../vis/treeChart');

module.exports = Backbone.View.extend({
    x:"r1",
    y:"r2",
    edgeRouting:"straight",

    initialize:function (options) {
        _.extend(this, options || {});
        _.bindAll(this, 'renderGraph', 'redrawTree', 'digColaLayout');
        this.redrawTree = _.throttle(this.redrawTree, 300);
        this.model.on("load", this.renderGraph);
    },

    renderGraph:function () {
        var _this = this;
        var parentDiv = this.$el.parent();
        var w = parentDiv.width();
        var h = parentDiv.height();

        var x = this.x;
        var y = this.y;
        var edgeRouting = this.edgeRouting || 'straight';

        var edge_scale = d3.scale.log().domain(d3.extent(_this.model.get("edges"), function (a) {
            return a[2];
        })).range([0.2, 1.0]);
        var edgeO = function (edge) {
            return edge_scale(edge.weight);
        };

        this.treeChart = new TreeChart({
            width:w,
            height:h,
            nodes:{
                data:this.model.get("nodes"),
                y:y,
                x:x,
                id:'feature_id'
            },
            edges:{
                data:_this.model.get("edges")
            }
        })
            .edgeOpacity(edgeO)
            .edgeRoute(edgeRouting)
            .on('node', nodeClicked)
            .on('edge', edgeClicked);

        d3.select(this.getEl())
            .call(this.treeChart);


        Backbone.Mediator.subscribe('dimension:select', dimension_selected, this, false);

        this.model.on('change', this.redrawTree);
        this.model.on('reset', this.redrawTree);

        function dimension_selected(dimension) {
            var nodes = _this.model.get("nodes");
            var scale = d3.scale.linear().domain(d3.extent(_.pluck(nodes, dimension))).range([0.1, 1.0]);
            _this.treeChart.nodeOpacity(function (node) {
                return scale(node[dimension]);
            })
            d3.select(this.getEl())
                .call(_this.treeChart.redraw);
        }

        function nodeClicked(node) {
            Backbone.Mediator.publish('feature:select', new Feature(node));
        }

        function edgeClicked(edge) {
            Backbone.Mediator.publish('edge:select', new Edge(edge));
        }
    },

    getEl: function() {
        return this.$el[0];
    },

    redrawTree:function () {
        this.treeChart.nodes(this.model.get("nodes")).edges(this.model.get("edges"));

        d3.select(this.getEl()).call(this.treeChart.redraw);
    },

    digColaLayout:function () {
        var _this = this;

        var graph = {
            nodes:_.map(_this.model.get("nodes"), function (node) {
                return [node[_this.x], node[_this.y]];
            }), edges:_.map(_this.model.get("edges"), function (link) {
                return [link.target, link.source, link.weight];
            })
        };

        this.treeChartVis.nodes(_this.model.get("nodes").map(function (n, index) {
            return _.extend(n, {_x:json.nodes[index][0], _y:json.nodes[index][1]});
        }));
        this.treeChartVis.nodeConfig({"x":"_x", "y":"_y"});
        d3.select(this.getEl()).call(function (selection) {
            _this.treeChart.redraw(selection);
        });
    }

});
