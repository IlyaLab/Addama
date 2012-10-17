var Model = require('./model');

module.exports = Model.extend({
    initialize: function(options) {
        _.extend(this, options);
        _.bindAll(this, "loadDataMenu");

        this.on("load", this.loadDataMenu)
    },

    url: function() {
        return this.url;
    },

    parse: function(txt) {
        return { "items": _.compact(_.map(d3.tsv.parse(txt), function(row) { return row["ID"] ? row : null; })) };
    },

    fetch : function(options) {
        return Model.prototype.fetch.call(this, _.extend({}, options, {dataType:'text'}));
    },

    loadDataMenu: function() {
        _.each(this.get("items"), function(item) {
            _.each(_.keys(item), function(k) { item[k.toLowerCase()] = item[k]; });
        });
    }

});