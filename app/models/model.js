// Base class for all models.
module.exports = Backbone.Model.extend({

    original_model:new Backbone.Model(),

    original:function (value) {
        if (!arguments.length) return this.original_collection;
        this.original_collection = value;
        return this;
    },

    make_copy: function(ModelClass, options) {
        if (ModelClass.prototype.add) {
            // is this a collection
            var copy = new ModelClass(options);
            copy.add(this.toJSON(), {silent:true});
            this.original_collection = copy;
        } else {
            //nope its a model
            this.original_collection = new ModelClass(this.toJSON());
        }
    }
});
