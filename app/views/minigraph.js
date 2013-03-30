module.exports = Backbone.View.extend({
    initialize: function() {
        console.log("minigraph.view.initialize:" + JSON.stringify(this.options));

        _.bindAll(this, "renderHello");

        this.model.on("load", this.renderHello);
    },

    render: function() {
        this.$el.html("minigraph on!");
        return this;
    },

    renderHello: function() {
        this.$el.html("minigraph hello!");
    }
});