var View = require('./view');
var LineItemTemplate = require("./templates/line_item");

module.exports = View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderMenuItems");

        this.model.on('load', this.renderMenuItems);
    },

    renderMenuItems: function() {
        var UL = this.$el;
        UL.empty();
        var items = this.model.get("items");
        if (items && items.length) {
            var itemsById = {};
            _.each(items, function(list) {
                UL.append(LineItemTemplate(_.extend(list, { "a_class":"select-item" })));
                itemsById[list.id] = list;
            });

            var _this = this;
            UL.find("li a.select-item").click(function(e) {
                // TODO: Put checkmarks next to selected item in list?
                // UL.find("i.icon-ok").removeClass("icon-ok");
                // $(e.target).find("i").addClass("icon-ok");
                _this.trigger(_this.selectEvent, itemsById[$(e.target).data("id")]);
            });
        }
    }
});