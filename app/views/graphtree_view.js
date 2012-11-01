var View = require('./view');
var template = require('./templates/graphtree');
var ParcoordsView = require('./parcoords_view');
var TreeChartView = require('./treechartvis_view');
var GraphControls = require('./graphtree_controls');

module.exports = View.extend({
    template:template,
    selected_layout_index:0,

    initialize:function (options) {
        _.extend(this, options || {});
        _.bindAll(this, 'renderElements', 'drawGraphTree');

        this.model.on("load", this.renderElements);
    },

    renderElements:function () {
        var _this = this;

        var allLayouts = _.first(this.model.get("layouts"));
        var selectedLayout = allLayouts.get("layout")[this.selected_layout_index];

        var graphControls = new GraphControls({ model:allLayouts });
        graphControls.on("apply-controls", function (c) {
            _this.selected_layout_index = c.selected_layout_index;
            _this.model.trigger("load");
        });

        var parcoordsView = new ParcoordsView({ model:selectedLayout });
        parcoordsView.on("select-nodes", function (nodes) {
            var newmodel = selectedLayout.filterNodes(nodes);
            _this.drawGraphTree(newmodel, graphControls);
            _.defer(function () {
                newmodel.trigger("load");
            });
        });

        this.$el.find('.graph-controls').html(graphControls.render().el);
        this.$el.find('.filter-container').html(parcoordsView.render().el);

        this.drawGraphTree(selectedLayout, graphControls);
        selectedLayout.fetch({
            success:function () {
                selectedLayout.trigger("load");
            }
        });
    },

    drawGraphTree:function (model, graphControls) {
        var tcView = new TreeChartView({ "model":model });
        this.$el.find('.graph-container').html(tcView.render().el);

        graphControls.on("dig-cola", function () {
            tcView.digColaLayout();
            model.trigger("load");
        });
    }
});
