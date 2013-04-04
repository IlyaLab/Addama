var BasicModel = Backbone.Model.extend({

    url: function () {
        return this.get("url");
    },

    parse: function (txt) {
        return { "items": d3.tsv.parse(txt) };
    },

    fetch: function (options) {
        return Backbone.Model.prototype.fetch.call(this, _.extend({dataType: "text"}, options));
    }
});

module.exports = Backbone.Model.extend({

    url: function () {
        return this.get_base_uri("nodes");
    },

    parse: function (txt) {
        var items = d3.tsv.parse(txt);

        var _this = this;
        var edges = new BasicModel({ "url": this.get_base_uri("edges") });
        edges.fetch({
            "async": false,
            "success": function () {
                _this.set("edges", edges.get("items"));
            }
        });

        return { "nodes": items };
    },

    fetch: function (options) {
        return Backbone.Model.prototype.fetch.call(this, _.extend({dataType: "text"}, options));
    },

    get_base_uri: function (suffix) {
        var data_uri = this.get("data_uri");
        var dataset_id = this.get("dataset_id");
        return data_uri + "/" + this.get("catalog_unit")[suffix];
    }

});