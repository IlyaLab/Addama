module.exports = Backbone.Model.extend({
    initialize:function (options) {
        _.extend(this, options);
    },

    url:function () {
        return this.url;
    },

    parse:function (data) {
        var itemsById = {};

        if (this.get("dataType")== "json") {
            if (data && data.items) {
                _.each(data.items, function(item) {
                    itemsById[item.id || item.feature_id] = item;
                });
            }
        } else {
            _.each(d3.tsv.parse(data), function (row) {
                if (row["ID"]) {
                    var item = {};
                    _.each(_.keys(row), function (k) {
                        item[k.toLowerCase()] = row[k];
                    });
                    itemsById[item.id] = item;
                }
            });
        }
        return { "itemsById": itemsById };
    },

    fetch:function (options) {
        return Backbone.Model.prototype.fetch.call(this, _.extend({dataType: this.get("dataType") || 'text'}, options));
    }
});