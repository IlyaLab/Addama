var View = require('./view');
var template = require('./templates/seqpeek');

module.exports = View.extend({
    template: template,
    label: "SeqPeek",
    className: "row-fluid",

    events: {
        "click .reset-sliders": "resetSliders"
    },

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, 'initControls', 'initGraph', 'resetSliders', 'onSubtypesChange', 'updateGraph');

        this.current_subtypes = [];
        this.drawGraph = _.once(this.initGraph);
    },

    afterRender: function () {
        this.initControls();
    },

    initControls: function () {
        var that = this;

        var cancer_subtypes = [
            'BRCA',
            'COADREAD',
            'GBM',
            'KIRC',
            'LAML',
            'LUAD',
            'LUSC',
            'OV',
            'PRAD',
            'STAD',
            'UCEC'
        ];

        var default_subtypes = ['UCEC', 'BRCA', 'GBM'];

        this.$el.find(".slider_scale_width").oncovis_range({ storageId: "slider_scale_width", min: 1000, max: 3000, initialStep: 1500 });
        this.$el.find(".slider_label_width").oncovis_range({ storageId: "slider_label_width", min: 20, max: 200, initialStep: 70 });

        // Populate the subtype lists
        _.each(default_subtypes, function(subtype) {
            var html = '<div class="subtype-list-member ui-state-default">' + subtype + '</div>';
            that.$el.find(".subtypes-included").append(html);
        });

        _.each(_.difference(cancer_subtypes, default_subtypes), function(subtype) {
            var html = '<div class="subtype-list-member ui-state-default">' + subtype + '</div>';
            that.$el.find(".subtypes-excluded").append(html);
        });

        this.$el.find(".subtypes-connected-sortable").sortable({
            item: '.subtype-list-member',
            connectWith: '.subtypes-connected-sortable',
            revert: true
        }).disableSelection();

        // Update event is fired after the DOM manipulation is finished
        this.$el.find(".subtypes-included").sortable('option', 'update', this.onSubtypesChange);

        var lastLabelWidth = 70;
        this.$el.find(".slider_label_width").bind("slide-to", function (event, value) {
            lastLabelWidth = value;
        });

        this.bind("post-render", function() {

        });

        // Trigger initial visualization
        this.onSubtypesChange();
    },

    resetSliders: function () {
        this.$el.find(".slider_scale_width").oncovis_range("reset");
        this.$el.find(".slider_label_width").oncovis_range("reset");
    },

    onSubtypesChange: function() {
        var gene_label;
        var ui_subtypes;

        ui_subtypes = this.$el
            .find(".subtypes-included .subtype-list-member")
            .map(function() {
                // The value is in div.textContent
                return this.textContent;
            });

        var new_subtypes = _.difference(ui_subtypes, this.current_subtypes);
        this.current_subtypes = ui_subtypes;

        if (new_subtypes.length > 0) {
            this.loadMutations(new_subtypes, 'TP53');
        }
        else {
            this.updateGraph();
        }
    },

    initGraph: function () {
        var data = this.data;

        // The subtypes may not be in the same order as in
        // the UI when they come from the data source.
        var order = this.current_subtypes.toArray();

        data.cancer_subtypes = data.cancer_subtypes.sort(function(a, b) {
            if (order.indexOf(a.label) < order.indexOf(b.label)) {
                return -1;
            }
            else if (order.indexOf(a.label) == order.indexOf(b.label)) {
                return 0;
            }
            else {
                return 1;
            }
        });

        // Hide protein scale and domains in all but the last subtype
        _.chain(data.cancer_subtypes)
            .initial()
            .each(function(subtype) {
                subtype.layout = {
                    protein_scale_line: {
                        enabled: true,
                        y: 0
                    },
                    protein_scale_ticks: {
                        enabled: false,
                        y: 0
                    },
                    protein_domains: {
                        enabled: false
                    }
                };
            });

        var options = {
            location_tick_height: 25,
            protein_scale_width: 1500,
            protein_scale_y: 40,
            protein_vertical_padding: 10,
            signature_height: 10,
            enable_transitions: true,
            enable_mutation_stems: true,
            mutation_layout: 'all_subtypes',
            mutation_stem_height: 50,
            mutation_shape_width: 8,
            mutation_group_padding: 0,
            mutation_colors: {
                Nonsense_Mutation: 'red',
                Silent: 'green',
                Frame_Shift_Del: 'gold',
                Frame_Shift_Ins: 'gold',
                Missense_Mutation: 'blue'
            },
            plot: {
                horizontal_padding: 30,
                vertical_padding: 30
            },

            // initial values based on slider defaults
            scale_width: this.$el.find(".slider_scale_width").oncovis_range("value"),
            band_label_width: this.$el.find(".slider_label_width").oncovis_range("value")
        };

        this.$el.find(".seqpeek-container").seqpeek(data, options);
        this.trigger("post-render");
    },

    updateGraph: function() {
        var data = this.data,
            that = this;

        this.drawGraph();

        var postProcessFn = function(subtypes) {
            _.chain(subtypes)
                .initial()
                .each(function(s) {
                    s.layout = {
                        protein_scale_line: {
                            enabled: true,
                            y: 0
                        },
                        protein_scale_ticks: {
                            enabled: false,
                            y: 0
                        },
                        protein_domains: {
                            enabled: false
                        }
                    };
                });

            _.last(subtypes).layout = {
                protein_scale_line: {
                    enabled: true,
                    y: 0
                },
                protein_scale_ticks: {
                    enabled: true,
                    y: 0
                },
                protein_domains: {
                    enabled: true
                }
            }
        };

        this.$el.find(".seqpeek-container").seqpeek('change_subtypes', data.cancer_subtypes, {
                subtype_order: this.current_subtypes.toArray(),
                post_process_fn: postProcessFn
            }
        );
    },

    ////////////////////////////
    // Data retrieval methods //
    ////////////////////////////
    buildMutationQuery: function(subtypes, gene_label, uniprot_id) {
        var subtype_str = _.map(subtypes, function(s) {
            return 'cancer_subtype = \'' + s + '\'';
        }).join(' OR ');

        var query_str = 'SELECT * ' + ' WHERE gene_label = \'' + gene_label + '\' AND (' + subtype_str + ') AND uniprot_id = \'' + uniprot_id  + '\'';
        var query_json = {
            tq: query_str,
            tqx: 'out:json_array'
        };

        var mutation_query_str = '?' + jQuery.param(query_json);
        return "/genespot_svc/mysql/mutations/query" + mutation_query_str;
    },

    buildUniprotQuery: function(uniprot_id) {
        var query_str = 'SELECT * WHERE uniprot_id = \'' + uniprot_id + '\' LIMIT 1';
        var query_json = {
            tq: query_str,
            tqx: 'out:json_array'
        };

        var uniprot_query_str = '?' + jQuery.param(query_json);
        return "/genespot_svc/mysql/uniprot/query" + uniprot_query_str;
    },

    buildInterproQuery: function(uniprot_id) {
        var interpro_query_str = '?' + "criteria={\"uniprot_id\":\"" + uniprot_id + "\"}";
        return "/genespot_svc/mongodb/local/interpro/_find" + interpro_query_str;
    },

    loadMutationForUniprotID: function(cancer_subtypes, gene_label, uniprot_id) {
        var that = this;
        var mutation_query,
            uniprot_query,
            interpro_query;

        var data = {};

        var successFn = _.after(3, function() {
            that.parseMutationData(data);
        });

        mutation_query = this.buildMutationQuery(cancer_subtypes, gene_label, uniprot_id);

        $.ajax({
            type: 'GET',
            url: mutation_query,
            context: this,
            success: function(json) {
                data.mutations = json;
                successFn();
            }
        });

        uniprot_query = this.buildUniprotQuery(uniprot_id);

        $.ajax({
            type: 'GET',
            url: uniprot_query,
            context: this,
            success: function(json) {
                data.protein = json;
                successFn();
            }
        });

        interpro_query = this.buildInterproQuery(uniprot_id);

        $.ajax({
            type: 'GET',
            url: interpro_query,
            context: this,
            success: function(json) {
                data.interpro = json.results;
                successFn();
            }
        });
    },

    loadMutations: function(cancer_subtypes, gene_label) {
        var query_str = 'SELECT gene_label, uniprot_id ' + ' WHERE gene_label = \'' + gene_label + '\' AND uniprot_id != \'UNIPROT_FAIL\' LIMIT 1';
        var query_json = {
            tq: query_str,
            tqx: 'out:json_array'
        };

        var uniprot_query = "/genespot_svc/mysql/mutations/query" + '?' + jQuery.param(query_json);

        $.ajax({
            type: 'GET',
            url: uniprot_query,
            context: this,
            success: function(json) {
                if (json.length > 0) {
                    this.loadMutationForUniprotID(cancer_subtypes, gene_label, json[0].uniprot_id);
                }
            }
        });
    },

    //////////////////////////
    // Data parsing methods //
    //////////////////////////
    parseMutationData: function(data) {
        var subtype_map = {},
            subtype_array = [];

        _.each(data.mutations, function(d) {
            if (_.has(subtype_map, d.cancer_subtype) == false)
            {
                subtype_map[d.cancer_subtype] = [];
            }

            subtype_map[d.cancer_subtype].push(d);
        });

        _.each(subtype_map, function(subtype_data, subtype_label) {
            subtype_array.push({
                label: subtype_label,
                mutations: _.filter(subtype_data, function(d) {
                    return d.uniprot_id != 'UNIPROT_FAIL';
                })
            });
        });

        var interpro_signatures = data.interpro[0].matches;

        var protein_data = data.protein[0];
        _.extend(protein_data, {
            domains: interpro_signatures
        });

        this.data = {
            protein: protein_data,
            cancer_subtypes: subtype_array
        };

        this.updateGraph();
    }
});
