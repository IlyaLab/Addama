var Model = require('./model');

module.exports = Model.extend({
    url:"svc/storage/genelists",

    collection: Backbone.Collection.extend({
        defaults: {
            label: "Untitled", values: []
        }
    }),

    initialize: function(options) {
        _.extend(this, options);
        _.bindAll(this, "save");
    },

    save:function (item) {
        var saved_item = {};
        // TODO : replace with _.omit(item, "id")
        _.each(_.without(_.keys(item), "id"), function(k) {
            saved_item[k] = item[k];
        });
        return $.ajax({
            url: (item.id) ? this.url + "/" + item.id : this.url,
            type:"POST",
            data: saved_item,
            context:this,
            success: function() {
                this.trigger("load");
            }
        });
    }
});