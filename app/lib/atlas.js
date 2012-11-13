var QEDRouter = require("./router");

// TODO : Pass genes and cancers as view options
// TODO :
module.exports = Backbone.View.extend({
    initialize: function(element, options) {
        console.log("initialize");
        this.$el = $(element);
        if (options) _.extend(this, options);
        _.bindAll(this, "emphasize", "maximize", "minimize", "minimize_all", "navigate");
    },

    emphasize: function(options) {
        var $step = options.$el;
        console.log("Atlas.emphasize:" + $step[0].id);

        this.minimize_all();
        this.navigate($step.find(".map-contents"), $step.data("medium"));
        _.defer(function() {
            $step.addClass("medium");
        });
    },

    maximize:function (options) {
        var $step = options.$el;
        console.log("Atlas.maximize:" + $step[0].id);

        this.minimize_all();
        this.navigate($step.find(".map-contents"), $step.data("big"));
        _.defer(function() {
            $step.addClass("big");
        });
    },

    minimize:function (options) {
        var $step = options.$el;
        console.log("Atlas.minimize:" + $step[0].id);

        $step.removeClass("medium");
        $step.removeClass("big");
        $step.addClass("small");

        this.navigate($step.find(".map-contents"), $step.data("small"));
    },

    minimize_all: function() {
        var _this = this;
        _.each(this.$el.find(".atlas-map"), function(atlasMap) {
            console.log("minimize_all=" + atlasMap);
            _this.minimize({"$el": $(atlasMap)});
        });
    },

    navigate: function(target, route) {
        if (route) {
            var route = route.replace("#v/", "");
            var uri = route.substring(0, route.lastIndexOf("/"));
            var view_name = route.substring(route.lastIndexOf("/") + 1);

            var router = new QEDRouter({"targetEl": $(target)});
            router.viewsByUri(uri, view_name);
        }
    }
});