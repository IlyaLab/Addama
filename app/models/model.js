// Base class for all models.
module.exports = Backbone.Model.extend({

    original_model:new Backbone.Model(),

    original:function (value) {
        if (!arguments.length) return this.original_collection;
        this.original_collection = value;
        return this;
    },

    standard_fetch:function () {
        this.fetch({
            success:function (m) {
                m.trigger('load');
            }
        });
        return this;
    }
});
