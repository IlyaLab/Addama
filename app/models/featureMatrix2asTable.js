module.exports = Backbone.Model.extend({
    url: function() {
        return this.get("data_uri");
    },

    parse: function(data) {
        this.set("items", data.items);
        if (_.isEmpty(data.items)) {
            return { "ROWS": [], "COLUMNS": [], "DATA": [] };
        }
        
        var ROWS = _.pluck(data.items, "id");
        var COLUMNS = _.keys(data.items[0].values);
        var coldict = {}
        _.each(COLUMNS, function(col,idx) {
            return coldict[col] = idx;
        });
        
        var row_array;
        var DATA = _.map(data.items, function (data_item) {
            row_array = [];
            _.each(data_item.values, function(value_obj, value_key) {
                row_array[coldict[value_key]] = value_obj;
            });
            return row_array;
        });
        return { "ROWS": ROWS, "COLUMNS": COLUMNS, "DATA": DATA };
    }
});