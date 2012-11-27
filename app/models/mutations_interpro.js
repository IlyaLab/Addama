module.exports = Backbone.Model.extend({
    fetch: function(param_options) {
        var that = this,
            gene,
            cancers = param_options.data.cancer;

        var data = {
            mutations: [],
            subtype_map: {}
        };

        if (_.isArray(param_options.data.gene)) {
            gene = param_options.data.gene[0];
        }
        else {
            gene = param_options.data.gene;
        }

        var buildMutationQuery = function (query_cancer, query_gene) {
            var service_uri = "svc/lookups/qed_lookups/mutations?",
                query;

            query = service_uri + "cancer=" + query_cancer + "&gene=" + query_gene;
            return query;
        };

        var successFn = function() {
            parseMutationData();
        };

        var mutationsLoadedFn = _.after(cancers.length, function() {
            var found_subtypes = _.keys(data.subtype_map);
            if (found_subtypes.length > 0) {
                var uniprot_id = data.subtype_map[found_subtypes[0]][0].uniprot_id;
                loadInterproFn(uniprot_id, successFn);
            }
        });

        var buildInterProQuery = function(uniprot_id) {
            var interpro_query_str = '?' + "uniprot_id=" + uniprot_id;
            return "/svc/lookups/interpro/interpro/" + interpro_query_str;
        };

        var loadInterproFn = function(uniprot_id, callback) {
            var interpro_query = buildInterProQuery(uniprot_id);

            $.ajax({
                type: 'GET',
                url: interpro_query,
                context: this,
                success: function(json) {
                    data.interpro = json.items;
                    callback();
                }
            });
        };

        var loadMutationsFn = function(cancer_label, gene_label, callback) {
            $.ajax({
                type: 'GET',
                url: buildMutationQuery(cancer_label, gene_label),
                context: this,
                success: function(json) {
                    if (json.items.length > 0) {
                        data.subtype_map[cancer_label] = json.items;
                    }
                    callback();
                }
            });
        };

        _.each(cancers, function(cancer_label) {
            loadMutationsFn(cancer_label, gene, mutationsLoadedFn);
        });

        // Parses all loaded data and finally triggers the 'load' event
        var parseMutationData = function() {
            var cancer_array = [];

            _.each(data.subtype_map, function(mutations, cancer_label) {
                cancer_array.push({
                    label: cancer_label,
                    mutations: mutations
                });
            });

            var interpro_signatures = data.interpro[0].matches;
            var protein_data = data.interpro[0];

            _.extend(protein_data, {
                domains: interpro_signatures
            });

            that.set("data", {
                protein: protein_data,
                cancer_subtypes: cancer_array
            });
            that.trigger("load");
        };
    }
});
