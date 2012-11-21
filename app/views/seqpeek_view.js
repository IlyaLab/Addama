var Template = require('./templates/seqpeek');
var LineItemTemplate = require("./templates/line_item");

module.exports = Backbone.View.extend({
    className: "row-fluid",
    cancers: [],
    current_subtypes: [],
    hideSelector: false,

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, 'initControls', 'initTypeahead', 'initGraph', 'initCancerSelector');
        _.bindAll(this, 'resetSliders', 'updateGraph', 'reloadModel');

        this.reloadModel = _.throttle(this.reloadModel, 1000);
        
        $.ajax({ url:"svc/data/lookups/genes", type:"GET", dataType:"text", success:this.initTypeahead });

        if (!this.hideSelector) {
            $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.initCancerSelector });
        }

        if (this.genes) {
            this.current_gene = this.genes[0];
        }

        this.model.on("load", this.initGraph);

        this.$el.html(Template({ "title": this.current_gene }));

        this.initControls();
    },

    initControls: function () {
        this.$el.find(".slider_scale_width").range_slider_control({ storageId: "slider_scale_width", min: 1000, max: 3000, initialStep: 1500 });
        this.$el.find(".slider_label_width").range_slider_control({ storageId: "slider_label_width", min: 20, max: 200, initialStep: 70 });

        var lastLabelWidth = 70;
        this.$el.find(".slider_label_width").bind("slide-to", function (event, value) {
            lastLabelWidth = value;
        });
    },

    initCancerSelector: function(txt) {
        var cancers = txt.trim().split("\n");

        var selected_cancers = this.cancers;
        _.each(cancers, function(cancer) {
            cancer = cancer.trim();
            if (selected_cancers.indexOf(cancer)) {
                $(".cancer-selector").append(LineItemTemplate({"li_class":"active","a_class":"toggle-active","id":cancer,"label":cancer}));
            } else {
                $(".cancer-selector").append(LineItemTemplate({"a_class":"toggle-active","id":cancer,"label":cancer}));
            }
        });
        $(".cancer-selector").sortable();

        var _this = this;
        $(".cancer-selector").find(".toggle-active").click(function(e) {
            $(e.target).parent().toggleClass("active");
            _this.current_subtypes = $(this).find("li.active a").data("id");
            _.defer(_this.reloadModel);
        });
    },

    initTypeahead:function(txt) {
        var genelist = txt.trim().split("\n");

        var _this = this;
        this.$el.find(".genes-typeahead").typeahead({
            source:function (q, p) {
                p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function (qi) {
                    return _.map(genelist, function (geneitem) {
                        if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                    });
                }))));
            },
            updater: function(txt) {
                if (_.isEqual(_this.current_gene, txt)) {
                    return _this.current_gene;
                }

                _this.current_gene = txt;
                _this.$el.find(".gene-title").html(_this.current_gene);
                _.defer(_this.reloadModel);
                return "";
            }
        });
    },

    resetSliders: function () {
        this.$el.find(".slider_scale_width").range_slider_control("reset");
        this.$el.find(".slider_label_width").range_slider_control("reset");
    },

    reloadModel: function() {
        if (_.isEmpty(this.current_gene)) return;

        if (_.isEmpty(this.current_subtypes)) {
            this.current_subtypes = _.compact(_.map(this.$el.find(".cancer-selector li.active a"), function(lia) {
                return $(lia).data("id");
            }));
        }

        var mutModel = this.model;
        mutModel.fetch({
            "data": {
                "gene": this.current_gene,
                "cancer": this.current_subtypes
            },
            "traditional": true,
            success: function() {
                mutModel.trigger("load");
            }
        });
    },

    initGraph: function () {
        if (!this.current_gene) {
            return;
        }
        
        var data = this.model.get("data");

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
            scale_width: this.$el.find(".slider_scale_width").range_slider_control("value"),
            band_label_width: this.$el.find(".slider_label_width").range_slider_control("value")
        };

        this.$el.find(".seqpeek-container").seqpeek(data, options);
    },

    updateGraph: function() {
        var data = this.model.get("data");

        this.initGraph();

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
            "subtype_order": this.current_subtypes,
            "post_process_fn": postProcessFn
        });
    }

});
