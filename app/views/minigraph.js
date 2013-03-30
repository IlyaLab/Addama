var Template = require("../templates/minigraph");

module.exports = Backbone.View.extend({
    initialize: function () {
        console.log("minigraph.view.initialize:" + JSON.stringify(this.options));

        _.bindAll(this, "renderData");

        this.model.on("load", this.renderData);
    },

    render: function () {
        this.$el.html("minigraph on!");
        return this;
    },

    renderData: function () {
        var nodes = this.model.get("nodes");
        var grouped = _.groupBy(nodes, "type");
        var nodetypes = _.map(grouped, function (group, type) {
            return {

                "label": type,
                "nodes": _.map(group, function (item) {
                    var keys = _.without(_.keys(item), "id", "type");
                    return {
                        "label": item["id"],
                        "measures": _.map(keys, function (key) {
                            return {
                                "label": key,
                                "value": item[key]
                            }
                        })
                    };
                })
            }
        });
        this.$el.html(Template({ "nodetypes": nodetypes }));
    }
});