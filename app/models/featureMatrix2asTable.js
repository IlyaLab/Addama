module.exports = Backbone.Model.extend({
    url:function () {
        return this.get("data_uri");
    },

    parse:function (data) {
        this.set("items", data.items);
        if (_.isEmpty(data.items)) {
            return { "ROWS":[], "COLUMNS":[], "DATA":[] };
        }

        var itemsByCancer = _.groupBy(data.items, "cancer");
        var dataByCancer = {};
        _.each(itemsByCancer, function (items, cancer) {
            if (_.isEmpty(data.items)) {
                dataByCancer[cancer] = { "ROWS":[], "COLUMNS":[], "DATA":[] };
            } else {
                var ROWS = _.pluck(items, "gene");
                var COLUMNS = _.pluck(items[0].values, "id");
                var coldict = {};
                _.each(COLUMNS, function (col, idx) {
                    coldict[col] = idx;
                });

                var DATA = _.map(items, function (data_item) {
                    var row_array = [];
                    _.each(data_item.values, function (value_obj) {
                        row_array[coldict[value_obj.id]] = value_obj.v;
                    });
                    return row_array;
                });
                dataByCancer[cancer] = { "ROWS":ROWS, "COLUMNS":COLUMNS, "DATA":DATA };
            }
        });

        return { "DATA_BY_CANCER":dataByCancer };
    }
});