var GenomicFeature = require('./genomic_feature');

module.exports = Backbone.Collection.extend({
    model: GenomicFeature,

    initialize: function(options) {
        console.log("adjacencies:" + JSON.stringify(options));
        _.extend(this, options);
        _.bindAll(this, "url", "parse", "headers", "fetch");
    },

    url:function () {
        console.log("url:" + this.data_uri);
        return this.data_uri;
    },

    parse:function (txt) {
//        var column_headers = this.get("catalog_unit")["column_headers"];
//        if (!_.isEmpty(column_headers)) {
//            txt = column_headers.join("\t") + "\n" + txt;
//        }
        return { "data":d3.tsv.parse(txt) };
    },

    headers: function() {
//        return this.get("catalog_unit")["column_headers"];
        return _.keys(this.at(0).toJSON());
    },

    fetch:function (options) {
        return Backbone.Collection.prototype.fetch.call(this,_.extend({},options,{dataType:'text'}));
    }
});
