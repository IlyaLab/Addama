module.exports = Backbone.Model.extend({

    url: function () {
        return this.get("data_uri");
    },

    parse: function(json) {
        var data = {};
        data["subtype_map"] = _.groupBy(json.items, "cancer");
        data["cancer_subtypes"] = _.map(data["subtype_map"], function(mutations, subtype_label) {
            return { label: subtype_label, mutations: mutations };
        });

        var uniprot_ids = _.uniq(_.pluck(json.items, "uniprot_id"));

        var interproModel = new Backbone.Model({});
        interproModel.fetch({
            url: "/svc/lookups/interpro/interpro",
            "traditional": true,
            "data": {
                "uniprot_id": uniprot_ids
            },
            "async": false,
            success: function() {
                data["interpro"] = interproModel.get("items");

                var protein_data = _.first(interproModel.get("items"));
                protein_data["domains"] = protein_data.matches;
                data["protein"] = protein_data;
            }
        });

        this.set("data", data);
    }
});
