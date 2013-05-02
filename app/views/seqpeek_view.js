var Template = require("./templates/seqpeek");
var LineItemTemplate = require("./templates/line_item");

module.exports = Backbone.View.extend({
    genes: [],
    cancers: [],
    current_subtypes: [],
    hideSelector: false,

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, "initGeneSelector", "initGraph", "initCancerSelector", "reloadModel", "setContainerSize");

        this.reloadModel = _.throttle(this.reloadModel, 1000);

        if (!this.hideSelector) {
            $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.initCancerSelector });
        }

        if (!_.isEmpty(this.genes)) {
            this.current_gene = this.genes[0];
        }

        this.initGeneSelector();

        this.model.on("load", this.initGraph);
        this.model.on("load", this.setContainerSize);
    },

    initGeneSelector: function () {
        this.$el.html(Template({ "selected_gene": this.current_gene }));

        var UL = this.$el.find(".seqpeek-gene-selector").empty();
        _.each(_.without(this.genes, this.current_gene), function(gene) {
            UL.append(LineItemTemplate({ "label":gene, "id":gene }));
        }, this);

        var _this = this;
        UL.find("li a").click(function(e) {
            _this.current_gene = $(e.target).data("id");
            _.defer(_this.reloadModel);
            _.defer(_this.initGeneSelector);
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

    reloadModel: function() {
        if (_.isEmpty(this.current_gene)) return;

        if (_.isEmpty(this.current_subtypes)) {
            this.current_subtypes = _.compact(_.map(this.$el.find(".cancer-selector li.active a"), function(lia) {
                return $(lia).data("id");
            }));
        }

        if (_.isEmpty(this.current_subtypes)) {
            this.current_subtypes = this.options.cancers;
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
        if (!this.current_gene) return;

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
            protein_scale_width: 1000,
            protein_scale_y: 40,
            protein_vertical_padding: 10,
            protein_domain_key: "dbname",
            signature_height: 10,
            enable_transitions: false,
            enable_mutation_stems: true,
            mutation_layout: "all_subtypes",
            mutation_stem_height: 15,
            mutation_stem_stroke_width: 0.5,
            mutation_shape_width: 2,
            mutation_group_padding: 0,
            mutation_colors: {
                Nonsense_Mutation: "red",
                Silent: "green",
                Frame_Shift_Del: "gold",
                Frame_Shift_Ins: "gold",
                Missense_Mutation: "blue"
            },
            plot: {
                horizontal_padding: 0,
                vertical_padding: 0
            },
            band_label_width: 100
        };

        this.$el.find(".seqpeek-container").seqpeek(data, options);
    },

    setContainerSize: function() {
        var size = this.$el.find(".seqpeek-container").seqpeek("get_size");
        this.$el.find(".seqpeek-container").css("width", size.width).css("height", size.height + 20);
    }
});
