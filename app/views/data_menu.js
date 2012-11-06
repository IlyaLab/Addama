var View = require('./view');
var DropdownTemplate = require("./templates/data_dropdown_menu");

module.exports = View.extend({
    events: {
        "click .selected-data-item": function(e) {
            this.trigger("select-data-item", {
                "unitId": $(e.target).data("unitid"),
                "itemId": $(e.target).data("itemid")
            });
        }
    },

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderMenuItems");

        this.renderMenuItems();
    },

    renderMenuItems: function() {
        var sectionId = this.sectionId;
        var menus = _.map(this.section, function(unit, unitId) {
            if (unit.catalog && !_.isEmpty(unit.catalog)) {
                return {
                    "label": unit.label,
                    "items": _.map(unit.catalog, function(item, itemId) {
                        return {
                            "label": item.label || itemId,
                            "unitId": unitId,
                            "itemId": itemId
                        };
                    })
                };
            }
        });

        this.$el.append(DropdownTemplate({ "label": this.section.label, "items": _.compact(menus) }));
    },

    afterRender: function() {
        var dropdownLIs = this.$el.find("li.dropdown");
        this.$el.find(".data-menu-toggle").click(function(e) {
            dropdownLIs.toggle(1000);
        });
    }
});