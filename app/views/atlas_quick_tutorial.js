var Template = require("../views/templates/atlas_quick_tutorial");

module.exports = Backbone.View.extend({
    initialize: function(options) {
        var _id = Math.round(Math.random() * 100000);
        this.$el.html(Template({"id":_id}));
    }
});