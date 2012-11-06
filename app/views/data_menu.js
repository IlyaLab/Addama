var View = require('./view');
var template = require("./templates/data_dropdown_menu");

module.exports = View.extend({
    template: template,

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
    },

    getRenderData: function() {
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

        return { "label": this.section.label, "items": _.compact(menus) };
    }
});