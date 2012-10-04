var Model = require('./model');

module.exports = Model.extend({
    initialize:function (options) {
        _.bindAll(this, 'getClusterProperty', 'getRowLabels');

        // TODO : Figure out the backbone way to do this
        $.ajax({
            url: "/svc/data/lookups/" + options.dataset_id + ".json",
            type: "GET",
            dataType: "json",
            context: this,
            success: function(json) {
                _.extend(this, json);
            }
        })
    },

    getClusterProperty:function () {
        return this.clusterProperty;
    },

    getRowLabels:function () {
        return this.rowLabels;
    }
});