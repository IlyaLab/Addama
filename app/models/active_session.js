module.exports = Backbone.Model.extend({
    url: function() {
        if (this.get("id")) {
            return "svc/storage/sessions/" + this.get("id");
        }
        return "svc/storage/sessions";
    },

    save:function (attributes, options) {
        if (attributes) {
            _.each(attributes, function(value, key) {
                this.set(key, value);
            }, this);
        }

        var saved_item = {};
        // TODO : replace with _.omit(item, "id")
        _.each(_.without(_.keys(this.attributes), "id"), function(k) {
            saved_item[k] = this.attributes[k];
        }, this);

        return $.ajax({
            url: this.url(),
            type:"POST",
            data: saved_item,
            context:this,
            success: function() {
                if (options && _.isFunction(options.success)) options.success();
            }
        });
    }
});