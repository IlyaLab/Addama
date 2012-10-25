var View = require('./view');
var LineItemTemplate = require("./templates/data_menu_item");
var MultiChoiceTemplate = require("./templates/data_menu_item_multichoice");

module.exports = View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderMenuItems");

        this.multiLoad([this.model, this.qedModel], this.renderMenuItems);
    },

    renderMenuItems: function() {
        if (this.model) {
            var items = this.model.get("items");
            if (items && items.length) {
                this.$el.append(LineItemTemplate({ "label": this.data_prefix, "li_class": "nav-header"}));

                var viewMappings = (this.qedModel.get("viewMappings") || {});
                var views = (viewMappings[this.data_prefix] || []);
                var _this = this;
                _.each(items, function(item) {
                    if (views.length > 1) {
                        var viewLinks = _.map(views, function(vMap) {
                            return { "a_href": "#" + _this.data_prefix + "/" + item.id + "/" + vMap, "label": vMap.charAt(0).toUpperCase() + vMap.slice(1) };
                        });
                        _this.$el.append(MultiChoiceTemplate({ "label": item.label, "lineitems": viewLinks }));
                    } else if (views.length == 1) {
                        _this.$el.append(LineItemTemplate(_.extend(item, { "a_href": "#" + _this.data_prefix + "/" + item.id + "/" + views[0] })));
                    } else {
                        _this.$el.append(LineItemTemplate(_.extend(item, { "a_href": "#" + _this.data_prefix + "/" + item.id + "/grid" })));
                    }
                });
            }
        }
    }
});