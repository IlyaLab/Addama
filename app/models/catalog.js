module.exports = Backbone.Model.extend({

    initialize:function (options) {
        _.extend(this, options);
    },

    url:function () {
        return this.url;
    },

    parse:function (txt) {
        var itemsById = {};
        var items = _.compact(_.map(d3.tsv.parse(txt), function (row) {
            if (_.has(row, "ID") && !_.isEmpty(row["ID"].trim())) {
                var item = {};
                _.each(_.keys(row), function (k) {
                    item[k.toLowerCase()] = row[k];
                });

                itemsById[item.id] = item;
                return item;
            }
            return null;
        }));

        var unit = this.unit;
        if (!unit.catalog) unit.catalog = {};
        _.each(itemsById, function(item, item_id) {
            if (!unit.catalog[item_id]) unit.catalog[item_id] = {};
            _.extend(unit.catalog[item_id], (unit["catalog_defaults"] || {}), item);
        });

        return { "items": items, "itemsById": itemsById};
    },

    fetch:function (options) {
        return Backbone.Model.prototype.fetch.call(this, _.extend({}, options, {dataType:'text'}));
    }
});