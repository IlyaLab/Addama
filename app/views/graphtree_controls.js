var View = require('./view');
var template = require('./templates/graphtree_controls');

module.exports = View.extend({
    template:template,
    control_options:{
        selected_layout_index:0,
        showLabels:true,
        showLines:true,
        layoutType:true
    },

    events:{
        "click .graph-controls-reset":function () {
            console.log("resetControls");
        },
        "click .toggle-labels .toggle-on":function () {
            this.control_options.showLabels = true;
        },
        "click .toggle-labels .toggle-off":function () {
            this.control_options.showLabels = false;
        },
        "click .toggle-lines .toggle-on":function () {
            this.control_options.showLines = true;
        },
        "click .toggle-lines .toggle-off":function () {
            this.control_options.showLines = false;
        },
        "click #dl-straight":function () {
            this.control_options.layoutType = "straight";
        },
        "click #dl-diagonal":function () {
            this.control_options.layoutType = "diagonal";
        },
        "click #dl-diagonal-directed":function () {
            this.control_options.layoutType = "diagonal-directed";
        },
        "click #dimensions-x a":function (e) {
            console.log("changeXAxis:" + $(e.target).html());
        },
        "click #dimensions-y a":function (e) {
            console.log("changeYAxis:" + $(e.target).html());
        },
        "click #colorby-nodes a":function (e) {
            console.log("colorByNodes:" + $(ev.target).html());
        },
        "click #colorby-edges a":function (e) {
            console.log("colorByEdges:" + $(e.target).html());
        },
        "click .toggle-on, .toggle-off":function (e) {
            if (!$(e.target).hasClass("active")) {
                $(e.target).parent().find("button").toggleClass("active");
            }
        },
        "click #dl-straight, #dl-diagonal, #dl-diagonal-directed":function (e) {
            $(".dynamic-layout .active").removeClass("active");
            $(e.target).addClass("active");
        },
        "click .dig-cola":function () {
            this.trigger("dig-cola");
        },
        "click .btn-apply":function () {
            this.trigger("apply-controls", this.control_options);
        }
    },

    initialize:function (options) {
        _.extend(this, options || {});
        _.bindAll(this, 'afterRender');
    },

    afterRender: function() {
        var _this = this;

        this.$el.find(".edgeslider").slider({
            max:this.model.get("layout").length,
            step:1,
            value:this.control_options.selected_layout_index,
            change:function (e, ui) {
                _this.control_options.selected_layout_index = ui.value;
            }
        });
    }
});
