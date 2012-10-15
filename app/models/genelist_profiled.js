var Model = require('./model');

module.exports = Model.extend({
    initialize: function(options) {
        _.extend(this, options);
        _.bindAll(this, "loadGeneListValues");

        this.on("load", this.loadGeneListValues)
    },

    url: function() {
        return "svc/data/lookups/genelists/CATALOG";
    },

    parse: function(txt) {
        return { "profiledLists": _.compact(_.map(d3.tsv.parse(txt), function(row) { return row["ID"] ? row : null; })) };
    },

    fetch : function(options) {
        return Model.prototype.fetch.call(this, _.extend({}, options, {dataType:'text'}));
    },

    loadGeneListValues: function() {
        _.each(this.get("profiledLists"), function(profiledList) {
            $.ajax({
                url: "svc/data/lookups/genelists/" + profiledList["ID"],
                type: "GET", dataType: "text",
                success: function(txt){
                    profiledList.values = txt.trim().split("\n");
                }
            })
        });
    }

});