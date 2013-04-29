module.exports = Backbone.Model.extend({
    initialize: function () {
        _.bindAll(this, "parseMutationData");
    },

    fetch: function (param_options) {
        var gene = param_options.data.gene;
        if (_.isArray(param_options.data.gene)) {
            gene = param_options.data.gene[0];
        }

        var cancers = param_options.data.cancer;
        var data = {
            mutations: [],
            subtype_map: {}
        };

        var service_uri = this.get("data_uri");
        var protein_db = "svc/" + this.get("catalog_unit")["protein_db"];
        var successFn = this.parseMutationData;

        var mutationsLoadedFn = _.after(cancers.length, function () {
            var found_subtypes = _.keys(data.subtype_map);
            if (found_subtypes.length > 0) {
                var uniprot_id = data.subtype_map[found_subtypes[0]][0].uniprot_id;

                $.ajax({
                    type: "GET",
                    url: protein_db,
                    "traditional": true,
                    "data": {
                        "uniprot_id": uniprot_id
                    },
                    context: this,
                    success: function (json) {
                        data.interpro = json.items;
                        successFn(data);
                    }
                });
            }
        });

        _.each(cancers, function (cancer_label) {
            $.ajax({
                "type": "GET",
                "url": service_uri,
                "traditional": true,
                "data": {
                    "cancer": cancer_label,
                    "gene": gene
                },
                "context": this,
                success: function (json) {
                    if (json.items.length > 0) {
                        data.subtype_map[cancer_label] = json.items;
                    }
                    mutationsLoadedFn();
                }
            });
        });
    },

    parseMutationData: function (data) {
        this.set("data", {
            protein: _.extend(data.interpro[0], { domains: data.interpro[0].matches }),
            cancer_subtypes: _.map(data.subtype_map, function (mutations, cancer_label) {
                return { "label": cancer_label, "mutations": mutations };
            })
        });
        this.trigger("load");
    }
});
