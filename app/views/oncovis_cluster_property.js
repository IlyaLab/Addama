var View = require('./view');
var template = require('./templates/oncovis_cluster_property');

module.exports = View.extend({
    template:template,

    events: {
        "click .cluster-select": function(e) {
            var selected_cluster = this.$el.find(".cluster-property").val();
            if (selected_cluster) {
                this.trigger("selected-cluster", selected_cluster);
            }
        },
        "click .no-cluster": function() {
            this.trigger("no-cluster");
        }
    },

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "initTypeahead");

        this.model.on('load', this.initTypeahead);
    },

    initTypeahead: function() {
        this.$el.find(".cluster-property").typeahead({ source: this.model.get("ROWS") });
    }

});
