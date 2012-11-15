var Model = require('./model');
var REQUIRED = null;

module.exports = Model.extend({
    analysis_id:REQUIRED,
    dataset_id:REQUIRED,

    initialize: function (options) {
        _.extend(this, options);
    },

    url: function () {
        return this.data_uri;
    },

    parse: function() {
        return {};
    },

    fetch: function (options) {

    }
});
