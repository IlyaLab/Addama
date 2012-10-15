var Model = require('./model');

module.exports = Model.extend({
    initialize:function (options) {
        _.extend(this, options);
    },

    url: function() {
        return "svc/data/lookups/configurations/" + this.dataset_id + ".json";
    }
});