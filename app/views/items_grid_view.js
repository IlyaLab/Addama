var Template = require("./templates/items_grid");

module.exports = Backbone.View.extend({

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, "processData");

        this.model.on("load", this.processData);
    },

    processData: function() {
        var items = this.model.get("items");
        var headers = _.keys(items[0]);
        var rows = _.map(items, function(item) {
            return { "values": _.values(item) };
        });

        this.$el.html(Template({
            "headers": headers,
            "rows": rows
        }));
    }
});
