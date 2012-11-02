var View = require('./view');
var DropdownTemplate = require("./templates/data_dropdown_menu");

module.exports = View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderMenuItems");

        this.renderMenuItems();
    },

    renderMenuItems: function() {
        var sectionId = this.sectionId;
        var menus = _.map(this.section, function(unit, unit_id) {

            if (unit.catalog && !_.isEmpty(unit.catalog)) {
                return {
                    "label": unit.label,
                    "items": _.map(unit.catalog, function(item, item_id) {
                        var views = qed.ViewMappings[item.model] || [{"label":"Grid","id":"grid"}];
                        return {
                            "label": item.label || item_id,
                            "items": _.map(views, function(view) {
                                return { "label": view.label, "href": "#v/" + sectionId + "/" + unit_id + "/" + item_id + "/" + view.id };
                            }),
                            "multiItem": (views.length > 1)
                        };
                    })
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