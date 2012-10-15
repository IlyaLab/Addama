var View = require('./view');
var ListHeaderTemplate = require("./templates/list_header");
var LineItemTemplate = require("./templates/line_item");

module.exports = View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderMenuItems");

        this.model.on('load', this.renderMenuItems);
    },

    renderMenuItems: function() {
        if (this.model) {
            var items = this.model.get("items");
            if (items && items.length) {
                if (this.header) {
                    $(".genelist-items").append(ListHeaderTemplate({"header": this.header}));
                }

                var itemsById = {};
                _.each(items, function(list) {
                    $(".genelist-items").append(LineItemTemplate(_.extend(list, { "a_class":"select-item" })));
                    itemsById[list.id] = list;
                });

                var _this = this;
                $(".genelist-items li a.select-item").click(function(e) {
                    $(".genelist-items i.icon-ok").removeClass("icon-ok");
                    $(e.target).find("i").addClass("icon-ok");
                    _this.trigger("genelist-selected", itemsById[$(e.target).data("id")]);
                });
            }
        }
    }
});