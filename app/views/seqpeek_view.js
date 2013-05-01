var View = require('./view');
var template = require('./templates/seqpeek');

module.exports = View.extend({
    template: template,
    label: "SeqPeek",
    className: "row-fluid",

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, 'initControls', 'initTypeahead', 'initGraph', 'initSubtypeLists', 'onGeneChange', 'onSubtypesChange', 'updateGraph', 'updateSummary');

        $.ajax({
            url:"svc/data/lookups/genes",
            type:"GET",
            dataType:"text",
            success:this.initTypeahead
        });

        $.ajax({
            url:"svc/data/lookups/cancers",
            type:"GET",
            dataType:"text",
            success:this.initSubtypeLists
        });

        this.current_gene = 'TP53';
        this.current_subtypes = [];
        this.drawGraph = _.once(this.initGraph);
    },

    afterRender: function () {
        this.initControls();
    },

    initControls: function () {
        this.updateSummary('LOADING');

        this.$el.find(".slider_scale_width").oncovis_range({ storageId: "slider_scale_width", min: 1000, max: 3000, initialStep: 1500 });
        this.$el.find(".slider_label_width").oncovis_range({ storageId: "slider_label_width", min: 20, max: 200, initialStep: 70 });

        var lastLabelWidth = 70;
        this.$el.find(".slider_label_width").bind("slide-to", function (event, value) {
            lastLabelWidth = value;
        });
    },

    initSubtypeLists: function(txt) {
        var that = this;
        var cancer_subtypes = txt.trim().split("\n");
        var default_subtypes = ['UCEC', 'BRCA', 'GBM'];

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

        // Trigger initial visualization
        this.onSubtypesChange();
    },

    initTypeahead:function(txt) {
        this.genelist = txt.trim().split("\n");

        var that = this;
        this.$el.find(".genes-typeahead").typeahead({
            source:function (q, p) {
                p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function (qi) {
                    return _.map(that.genelist, function (geneitem) {
                        if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                    });
                }))));
            },
            updater: that.onGeneChange,

            updater2:function (gene) {
                if (gene == that.current_gene) {
                    return;
                }

                that.current_gene = gene;

                // Setting current subtypes empty will make onSubtypesChange to
                // load mutations for every subtype.
                that.curret_subtypes = [];
                that.drawGraph = _.once(that.initGraph);

                that.onSubtypesChange();
            }
        });
    },

    resetSliders: function () {
        this.$el.find(".slider_scale_width").oncovis_range("reset");
        this.$el.find(".slider_label_width").oncovis_range("reset");
    },

    onGeneChange: function(gene) {
        if (gene == this.current_gene) {
            return;
        }

        this.current_gene = gene;

        // Setting current subtypes empty will make onSubtypesChange
        // reload mutations for every subtype.
        this.curret_subtypes = [];
        this.drawGraph = _.once(this.initGraph);

        this.onSubtypesChange();
    },

    onSubtypesChange: function() {
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
            this.loadMutations(new_subtypes, this.current_gene);
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
        var data = this.data;

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

        this.updateSummary();
    },

    updateSummary: function(message) {
        var summary_text = message || this.current_gene;
        this.$el.find('.gene-summary h1').text(summary_text);
    },

    ////////////////////////////
    // Data retrieval methods //
    ////////////////////////////
    buildMutationQuery: function(cancer_subtype, gene_label) {
        var mutation_query = "?gene=" + gene_label + "&cancer=" + cancer_subtype;
        return "/svc/lookups/qed_lookups/mutations/" + mutation_query;
    },

    buildInterProQuery: function(uniprot_id) {
        var interpro_query_str = '?' + "uniprot_id=" + uniprot_id;
        return "/svc/lookups/interpro/interpro/" + interpro_query_str;
    },

    loadMutations: function(cancer_subtypes, gene_label) {
        var that = this;

        var data = {
            mutations: [],
            subtype_map: {}
        };

        var successFn = function() {
            that.parseMutationData(data);
        };

        var mutationsLoadedFn = _.after(cancer_subtypes.length, function() {
            var found_subtypes = _.keys(data.subtype_map);
            // TODO Indicate to user if no mutations were found
            if (found_subtypes.length > 0) {
                var uniprot_id = data.subtype_map[found_subtypes[0]][0].uniprot_id;
                load_interpro_fn(uniprot_id, successFn);
            }
        });

        var load_mutations_fn = function(subtype, gene_label, callback) {
            $.ajax({
                type: 'GET',
                url: that.buildMutationQuery(subtype, gene_label),
                context: this,
                success: function(json) {
                    if (json.items.length > 0) {
                        data.subtype_map[subtype] = json.items;
                    }
                    callback();
                }
            });
        };

        var load_interpro_fn = function(uniprot_id, callback) {
            var interpro_query = that.buildInterProQuery(uniprot_id);

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

        _.each(cancer_subtypes, function(s) {
            load_mutations_fn(s, gene_label, mutationsLoadedFn);
        });
    },

    //////////////////////////
    // Data parsing methods //
    //////////////////////////
    parseMutationData: function(data) {
        var subtype_array = [];

        _.each(data.subtype_map, function(mutations, subtype_label) {
            subtype_array.push({
                label: subtype_label,
                mutations: mutations
            });
        });

        var interpro_signatures = data.interpro[0].matches;
        var protein_data = data.interpro[0];
        
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
