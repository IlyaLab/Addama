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
        return this.data_uri;
    },

    fetch: function() {

    },

    parse: function() {

    }
});
