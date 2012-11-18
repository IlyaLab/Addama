var Template = require('./templates/mutsig_grid');

module.exports = Backbone.View.extend({

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, "processData");

        this.model.on("load", this.processData);
    },

    processData: function() {
        var items = this.model.get("items");
        var data = _.groupBy(items, "gene");
        var cancers = _.uniq(_.pluck(items, "cancer"));
        var genes = _.uniq(_.pluck(items, "gene"));
        
        this.$el.html(Template({
            "cancers": _.map(cancers, function(c) {
                return { "id": c };
            }),
            "genes": _.map(genes, function(gene) {
                return {
                    "id": gene,
                    "rank_by_cancer": data[gene]
                };
            })
        }));
    }
});
