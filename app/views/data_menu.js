var View = require('./view');
var DropdownTemplate = require("./templates/data_dropdown_menu");

module.exports = View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderMenuItems");

        this.renderMenuItems();
    },

    renderMenuItems: function() {
        var viewMappings = (qed.Display.get("viewMappings") || {});

        var sectionId = this.sectionId;
        var menus = _.map(this.section, function(unit, unit_id) {
            var views = (viewMappings[unit_id] || []);
            views = (views.length) ? views : ["grid"];

            if (unit.catalog && !_.isEmpty(unit.catalog)) {
                return {
                    "label": unit.label,
                    "items": _.map(unit.catalog, function(item, item_id) {
                        return {
                            "label": item.label || item_id,
                            "items": _.map(views, function(view) {
                                var capitalLabel = view.charAt(0).toUpperCase() + view.substring(1).toLowerCase();
                                return { "label": capitalLabel, "href": "#" + sectionId + "/" + unit_id + "/" + item_id + "/" + view };
                            })
                        };
                    }),
                    "multiItem": (views.length > 1)
                };
            }
        });

        this.$el.append(DropdownTemplate({ "label": this.section.label, "items": _.compact(menus) }))
    },

    afterRender: function() {
        var dropdownLIs = this.$el.find("li.dropdown");
        this.$el.find(".data-menu-toggle").click(function(e) {
            dropdownLIs.toggle(1000);
        });
    }
});