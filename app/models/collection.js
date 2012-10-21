// Base class for all collections.
module.exports = Backbone.Collection.extend({

    original_collection : Backbone.Collection,

    original: function(value) {
        if (!arguments.length) return this.original_collection;
        this.original_collection = value;
        return this;
    },

    make_copy: function(CollectionClass, options) {
        if (CollectionClass.prototype.add) {
            // is this a collection
            var copy = new CollectionClass(options);
            copy.add(this.toJSON(), {silent:true});
            this.original_collection = copy;
        } else {
            //nope its a model
            this.original_collection = new CollectionClass(this.toJSON());
        }
    }
});
