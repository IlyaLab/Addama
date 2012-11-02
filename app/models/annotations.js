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
            if (row["ID"]) {
                var item = {};
                _.each(_.keys(row), function (k) {
                    item[k.toLowerCase()] = row[k];
                });

                itemsById[item.id] = item;
                return item;
            }
            return null;
        }));

        return { "itemsById": itemsById };
    },

    fetch:function (options) {
        return Backbone.Model.prototype.fetch.call(this, _.extend({}, options, {dataType:'text'}));
    }
});