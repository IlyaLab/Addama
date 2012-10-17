require('lib/view_helper');

// Base class for all views.
module.exports = Backbone.View.extend({
    initialize:function () {
        this.render = _.bind(this.render, this);
    },

    template:function () {
    },
    getRenderData:function () {
    },

    render:function () {
        this.$el.html(this.template(this.getRenderData()));
        this.afterRender();
        return this;
    },

    refresh:function () {
        this.$el.html(this.template(this.getRenderData()));
    },

    afterRender:function () {
    },

    multiLoad:function (models, callback) {
        if (models && models.length && callback) {
            console.log("multiLoad [" + models.length + "]");
            callback = _.after(models.length, callback);

            _.each(models, function (model) {
                model.on("load", callback);
            });
        }
    }
});
