var View = require('./view');
var Graph = require('../models/graph');

module.exports = View.extend({

    model:Graph,

    initialize:function () {
        _.bindAll(this, 'render', 'showData');
    },

    afterRender:function () {
        this.$el.addClass('parcoords').attr('id', 'test');
        this.model.on('load', this.showData);
    },

    showData:function () {
        var nodes = this.model.get("nodes");
        var keys = _.difference(_.keys(nodes[0]), ['label', 'type', 'source', 'feature_id', 'nByi', '_pos']);

        var pc = d3.parcoords()('#test');

        var _this = this;
        var brushFn = function(nodes) {
            _this.trigger("select-nodes", nodes);
        };

        pc.dimensions(keys)
            .data(nodes)
            .render()
            .color("#000")
            .alpha(0.3)
            .margin({ top:30, left:0, bottom:12, right:0 })
            .render()
            .reorderable()
            .brushable()
            .on('brush', _.throttle(brushFn, 500));

        pc.svg.selectAll(".parcoords-dimension")
            .on("click", toggle_dimension);

        function select(dimension) {
            pc.svg.selectAll(".parcoords-dimension")
                .filter(function (d) {
                    return d == dimension;
                })
                .classed('selected', true);
        }

        function unselect() {
            pc.svg.selectAll(".parcoords-dimension")
                .classed('selected', false);
        }

        function toggle_dimension(dimension) {

            var dim = pc.svg.selectAll(".parcoords-dimension.selected")
                .filter(function (d) {
                    return d == dimension;
                });

            if (dim[0].length > 0) {  //this was previously selected
                unselect();
                Backbone.Events.trigger('');
                console.log('previous');
            } else {    //this was not previously selected
                unselect();
                select(dimension);
                Backbone.Mediator.pub('dimension:select', dimension);
            }
        }

    }
});