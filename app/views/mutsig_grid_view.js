var Template = require('./templates/data_grid');

module.exports = Backbone.View.extend({
    header_attribute: "cancer",
    row_attribute: "gene",
    cell_attribute: "rank",

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, "processData");

        this.model.on("load", this.processData);
    },

    processData: function() {
        var items = this.model.get("items");
        var data = _.groupBy(items, this.row_attribute);
        var rowlabels = _.uniq(_.pluck(items, this.row_attribute));
        var headers = _.map(_.uniq(_.pluck(items, this.header_attribute)), function(h) {
            return { "id": h };
        });

        _.each(items, function(item) {
            item["cell_value"] = item[this.cell_attribute];
            item["cell_cls"] = "plain-cell";
        }, this);

        this.$el.html(Template({
            "header_cls": "centered-header",
            "headers": headers,
            "rows": _.map(rowlabels, function(rowlabel) {
                return { "label": rowlabel, "label_cls": "plain-cell", "values": data[rowlabel] };
            })
        }));
    }
});
