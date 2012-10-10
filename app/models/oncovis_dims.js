var Model = require('./model');

module.exports = Model.extend({
    initialize:function (options) {
        _.bindAll(this, 'getClusterProperty', 'getRowLabels');

        this.dataset_id = options.dataset_id;
        // TODO : Figure out the backbone way to do this
        // $.ajax({
        //     url: "svc/data/lookups/" + options.dataset_id + ".json",
        //     type: "GET",
        //     dataType: "json",
        //     context: this,
        //     success: function(json) {
        //         _.extend(this, json);
        //     }
        // })
    },

    url: function() {
        return "svc/data/lookups/" + this.dataset_id+".json";
    },

    getClusterProperty:function () {
        return this.get("clusterProperty");
    },

    getRowLabels:function () {
        return this.get("rowLabels");
    }
});