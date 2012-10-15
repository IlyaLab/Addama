var View = require('./view');
var LineItemTemplate = require("./templates/data_menu_item");

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
                var data_prefix = this.data_prefix;
                var data_suffix = this.data_suffix;
                var menuUL = this.$el;

                var itemsById = {};
                _.each(items, function(list) {
                    menuUL.append(LineItemTemplate(_.extend(list, { "a_href": data_prefix + "/" + list.id + "/" + data_suffix })));
                    itemsById[list.id] = list;
                });
            }
        }
    }
});