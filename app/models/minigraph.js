var TsvParse = function (text) {
    var header;
    return d3.tsv.parseRows(text, function (row, i) {
        if (i) {
            var o = {}, j = -1, m = header.length;
            while (++j < m) {
                var rowvalue = row[j];
                if (_.isString(rowvalue)) rowvalue = rowvalue.trim();
                o[header[j]] = rowvalue;
            }
            return o;
        } else {
            header = _.map(row, function (k) {
                if (_.isString(k)) return k.trim();
                return k;
            });
            return null;
        }
    });
};

var BasicModel = Backbone.Model.extend({

    url: function () {
        return this.get("url");
    },

    parse: function (txt) {
        return { "items": TsvParse(txt) };
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
        var nodes = TsvParse(txt);

        var _this = this;
        var edges = new BasicModel({ "url": this.get_base_uri("edges") });
        edges.fetch({
            "async": false,
            "success": function () {
                _this.set("edges", edges.get("items"));
            }
        });

        var measured_values = [];
        if (_.has(this.attributes, "measured_values")) {
            measured_values = this.get(this.get("measured_values")) || [];
        }

        _.each(nodes, function (node) {
            node.uid = _.uniqueId("node_");
        });

        var measure_keys = [];
        var count = 0;
        var nodetypes = _.map(_.groupBy(nodes, "type"), function (group, type) {
            return {
                "label": type,
                "notFirst": (count++ > 0),
                "nodes": _.map(group, function (item) {
                    var targeted_keys = _.without(_.keys(item), "id", "type", "uid");
                    if (!_.isEmpty(measured_values)) targeted_keys = _.intersection(measured_values, targeted_keys);

                    return {
                        "uid": item["uid"],
                        "label": item["id"],
                        "measures": _.map(targeted_keys, function (key) {
                            measure_keys.push(key);
                            return { "key": key, "value": item[key] };
                        }, this)
                    };
                }, this)
            }
        }, this);

        return { "nodes": nodes, "nodesByType": nodetypes, "measureKeys": _.uniq(measure_keys) };
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