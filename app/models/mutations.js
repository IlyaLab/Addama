var Interpro = Backbone.Model.extend({
    initialize: function (options) {
        _.extend(this, options);
    },

    fetch: function() {

    },

    parse: function() {

    }
});

module.exports = Backbone.Model.extend({
    initialize: function (options) {
        _.extend(this, options);
    },

    url: function () {
        return "svc/" + this.catalog_unit.service + "?cancer=BLAH";
    },

    fetch: function() {

    },

    parse: function() {

    }
});
