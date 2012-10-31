var View = require('./view');
var template = require('./templates/graph');
var Graph = require('../models/graph');
var TreeChart = require('../vis/treeChart');
var PC = require('./parcoords_view');

module.exports = View.extend({
    model:Graph,
    template:template,
    selected_layout_index:0,

    defaults:{
        x:"r1",
        y:"hodge",
        edgeRouting:"straight"
    },

    events:{
        "click .dig-cola":"digColaLayout",
        "click .graph-controls-reset":"resetControls",
        "click .toggle-labels .toggle-on":"showLabels",
        "click .toggle-labels .toggle-off":"hideLabels",
        "click .toggle-lines .toggle-on":"showLines",
        "click .toggle-lines .toggle-off":"hideLines",
        "click .toggle-on, .toggle-off":"toggleActive",
        "click #dl-straight, #dl-diagonal, #dl-diagonal-directed":"toggleDynLayout",
        "click #dl-straight":"layoutStraight",
        "click #dl-diagonal":"layoutDiagonal",
        "click #dl-diagonal-directed":"layoutDiagonalDirected",
        "click #dimensions-x a":"changeXAxis",
        "click #dimensions-y a":"changeYAxis",
        "click #colorby-nodes a":"colorByNodes",
        "click #colorby-edges a":"colorByEdges",
        "click .btn-apply":function () {
            this.model.trigger("load");
        }
    },

    initialize:function (options) {
        _.extend(this, options || {});
        _.bindAll(this, 'renderGraph', 'renderPCView', 'renderLayoutSelector');
        _.bindAll(this, 'getNodesArray', 'getEdgesArray');
        _.bindAll(this, 'redrawTree', 'resetControls', 'digColaLayout');
        _.bindAll(this, 'showLabels', 'hideLabels', 'showLines', 'hideLines');
        _.bindAll(this, 'toggleActive', 'toggleDynLayout', 'layoutStraight', 'layoutDiagonal', 'layoutDiagonalDirected');
        _.bindAll(this, 'changeXAxis', 'changeYAxis', 'colorByNodes', 'colorByEdges');
        this.redrawTree = _.throttle(this.redrawTree, 300);
        this.model.on("load", this.renderGraph);
        this.model.on("load", this.renderPCView);
        this.model.on("load", this.renderLayoutSelector);
    },

    redrawTree:function () {
        this.treeChart.nodes(this.getNodesArray()).edges(this.getEdgesArray());

        d3.select('.graph-container').call(this.treeChart.redraw);
    },

    renderLayoutSelector:function () {
        var first_layouts = _.first(this.model.get("layouts")).get("layout");
        var _this = this;

        this.$el.find(".edgeslider").slider({
            max:first_layouts.length,
            step:1,
            value:this.selected_layout_index,
            change:function (event, ui) {
                _this.selected_layout_index = ui.value;
            }
        });
    },

    renderPCView:function () {
        var filter = this.$el.find('.filter-container');
        var model = _.first(this.model.get("layouts")).get("layout")[this.selected_layout_index];
        var pc_view = new PC({ model:model });
        filter.html(pc_view.render().el);
        model.trigger("load");
    },

    renderGraph:function () {
        var _this = this;
        var parentDiv = this.$el.find('.graph-container');
        parentDiv.empty();
        var w = parentDiv.width();
        var h = parentDiv.height();

        var x = this.x;
        var y = this.y;
        var edgeRouting = this.edgeRouting || 'straight';

        var edge_scale = d3.scale.log().domain(d3.extent(_this.getEdgesArray(), function (a) {
            return a[2];
        })).range([0.2, 1.0]);
        var edgeO = function (edge) {
            return edge_scale(edge.weight);
        };

        this.treeChart = new TreeChart({
            width:w,
            height:h,
            nodes:{
                data:this.getNodesArray(),
                y:y,
                x:x,
                id:'feature_id'
            },
            edges:{
                data:this.getEdgesArray()
            }
        })
            .edgeOpacity(edgeO)
            .edgeRoute(edgeRouting)
            .on('node', nodeClicked)
            .on('edge', edgeClicked);

        d3.select('.graph-container')
            .call(this.treeChart);


        Backbone.Mediator.subscribe('dimension:select', dimension_selected, this, false);

        this.model.on('change', this.redrawTree);
        this.model.on('reset', this.redrawTree);

        function dimension_selected(dimension) {
            var nodes = _this.getNodesArray();
            var scale = d3.scale.linear().domain(d3.extent(_.pluck(nodes, dimension))).range([0.1, 1.0]);
            _this.treeChart.nodeOpacity(function (node) {
                return scale(node[dimension]);
            })
            d3.select('.graph-container')
                .call(_this.treeChart.redraw);
        }

        function nodeClicked(node) {
            Backbone.Mediator.publish('feature:select', new Feature(node));
        }

        function edgeClicked(edge) {
            Backbone.Mediator.publish('edge:select', new Edge(edge));
        }
    },

    getNodesArray:function () {
        var selected_layout = _.first(this.model.get("layouts")).get("layout")[this.selected_layout_index];
        return selected_layout.get("nodes");
    },

    getEdgesArray:function () {
        var selected_layout = _.first(this.model.get("layouts")).get("layout")[this.selected_layout_index];
        return selected_layout.get("edges");
    },

    digColaLayout:function (e) {
        var _this = this;

        var graph = {
            nodes:_.map(_this.model.getNodesArray(), function (node) {
                return [node[_this.x], node[_this.y]];
            }), edges:_.map(_this.getEdgesArray(), function (link) {
                return [link.target, link.source, link.weight];
            })
        };
        $.ajax({
            type:'POST',
            url:'graph_layout/layout',
            dataType:'json',
            contentType:'application/json',
            data:JSON.stringify(graph),
            success:function (json, status, xhr) {
                if (json.nodes) {
                    this.treeChart.nodes(_this.model.getNodesArray().map(function (n, index) {
                        return _.extend(n, {_x:json.nodes[index][0], _y:json.nodes[index][1]});
                    }));
                    this.treeChart.nodeConfig({"x":"_x", "y":"_y"});
                    d3.select('.graph-container')
                        .call(this.treeChart.redraw);
                }
            },
            context:_this
        })
    },

    showLabels:function (ev) {
        console.log("showLabels");
    },

    hideLabels:function (ev) {
        console.log("hideLabels");
    },

    showLines:function () {
        console.log("showLines");
    },

    hideLines:function () {
        console.log("hideLines");
    },

    resetControls:function () {
        console.log("resetControls");
    },

    toggleActive:function (ev) {
        var el = ev.target;
        if (!$(el).hasClass("active")) {
            $(el.parentNode).find("button").toggleClass("active");
        }
    },

    toggleDynLayout:function (ev) {
        $(".dynamic-layout .active").removeClass("active");
        $(ev.target).addClass("active");
    },

    layoutStraight:function (ev) {
        console.log("layoutStraight");
    },

    layoutDiagonal:function (ev) {
        console.log("layoutDiagonal");
    },

    layoutDiagonalDirected:function (ev) {
        console.log("layoutDiagonalDirected");
    },

    changeXAxis:function (ev) {
        ev.preventDefault();
        console.log("changeXAxis:" + $(ev.target).html());
    },

    changeYAxis:function (ev) {
        ev.preventDefault();
        console.log("changeYAxis:" + $(ev.target).html());
    },

    colorByNodes:function (ev) {
        ev.preventDefault();
        console.log("colorByNodes:" + $(ev.target).html());
    },

    colorByEdges:function (ev) {
        ev.preventDefault();
        console.log("colorByEdges:" + $(ev.target).html());
    }

});
