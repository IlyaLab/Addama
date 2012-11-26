var View = require("./view");
var template = require("./templates/circ");

module.exports = View.extend({
    template:template,
    className:"row-fluid",

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "loadData", "getCirc");

        this.model.on("load", this.loadData);
    },

    loadData:function () {
        if (!_.isEmpty(this.cancers)) {
            var vis = this.getCirc();
            var aByC = this.model.get("associationsByCancer");
            _.map(this.cancers, function(cancer) {
                var associations = aByC[cancer.toLowerCase()];
                if (associations) {
                    var data = associations.get("data");
                    if (data && data.edges) {
                        vis.addEdges(data.edges);
                    }
                }
            }, this);
        }
    },

    getCirc:function () {
        var $div = this.$el.find(".circ-container");
        var div = $div.get(0);
        var width = $div.width();
        var height = $div.height();

        var hovercard_config = {
            Feature:"label",
            Location:function (feature) {
                return "Chr " + feature.chr + " " + feature.start + (feature.end ? "-" + feature.end : "");
            }
        };

        var annotations = qed.Annotations[this.model.get("dataset_id")] || {};
        if (!_.isEmpty(annotations)) {
            var headers = _.keys(annotations[_.first(_.keys(annotations))]);
            _.each(headers, function (header) {
                hovercard_config[header] = header;
            });
        }

        var color_scale = {
            "GEXP": "#1f77b4",
            //blue
            "METH": "#2ca02c",
            //green
            "CNVR": "#ff7f0e",
            //orange
            "MIRN": "#9467bd",
            //purple
            "GNAB": "#d62728",
            //red
            "PRDM": "#8c564b",
            //pink
            "RPPA": "#e377c2",
            //brown
            "CLIN": "#aa4444",
            "SAMP": "#bcbd22",
            "other" : "#17becf"
        };

        function clin_type(feature) {
            return feature && feature.clin_alias && !!~feature.clin_alias.indexOf(":") ?
                feature.clin_alias.split(":")[1] : "other";
        }

        var tick_colors = function(data) {
            return type_color(data.source.toUpperCase());
        };

        var type_color = function(type) {
            return color_scale[type] || color_scale["other"];
        };

        var label_map = {
            "METH" : "DNA Methylation",
            "CNVR": "Copy Number Variation Region",
            "MIRN" :"microRNA",
            "GNAB" : "Gene Aberration",
            "GEXP": "Gene Expression",
            "CLIN": "Clinical Data",
            "SAMP": "Tumor Sample"
        };

        var types = Object.keys(label_map);

        var hovercard_items_config = {
            "Feature":function(feature) {
                return feature.source + " (<span style=\"color:" + type_color(feature.source) + "\">" + label_map[feature.source.toUpperCase()] + "</span>)";
            },
            "Location": function(feature) {
                return "Chr " + feature.chr + " " + feature.start + (feature.end ? "-" + feature.end : "");
            },
            "Somatic Mutations": "mutation_count"
        };

        var clinical_hovercard_items_config = _.extend({}, hovercard_items_config);

        _.extend(clinical_hovercard_items_config,
            {
                "Clinical Coorelate" : function(feature) {
                    var label = feature.clin_alias.split(":");
                    return label[2] + " (<span style=\"color:" + type_color(clin_type(feature)) + "\">" + label_map[clin_type(feature)] + "</span>)";
                }
            }
        );


        var links = [
            {
                label: "UCSC Genome Browser",
                key: "ucsc",
                url: "http://genome.ucsc.edu/cgi-bin/hgTracks",
                uri: "?db=hg18&position=chr",
                href: function(feature) {
                    return "http://genome.ucsc.edu/cgi-bin/hgTracks?db=hg18&position=chr" + feature.chr + ":" + feature.start + (feature.end == "" ? "" : "-" + feature.end);
                }
            },
            //ucsc_genome_browser
            {
                label: "Ensembl",
                key: "ensembl",
                url: "http://uswest.ensembl.org/Homo_sapiens/Location/View",
                uri: "?r=",
                href: function(feature) {
                    return "http://uswest.ensembl.org/Homo_sapiens/Location/View?r=" + feature.chr + ":" + feature.start + (feature.end == "" ? "" : "-" + feature.end);
                }
            },
            //ensemble
            {
                label: "Cosmic",
                key: "cosmic",
                url: "http://www.sanger.ac.uk/perl/genetics/CGP/cosmic",
                uri: "?action=bygene&ln=",
                href: function(feature) {
                    return _.include(["CNVR", "MIRN","METH"], feature.source) ? "http://www.sanger.ac.uk/perl/genetics/CGP/cosmic?action=bygene&ln=" + feature.label.split(":")[2] : null;
                }
            },
            {
                label: "miRBase",
                key: "mirbase",
                url: "http://mirbase.org/cgi-bin/query.pl",
                uri: "?terms=",
                href: function(feature) {
                    return feature.source == "MIRN" ? "http://www.mirbase.org/cgi-bin/query.pl?terms=" + feature.label.split(":")[2] : null;
                }
            }
        ];

        var hovercard_links_config = {};

        _.each(links, function(item) {
            hovercard_links_config[item.label] = item;
        });

        var key_order = _.keys(qed.Lookups.Chromosomes.get("itemsById"));
        var key_length = _.map(qed.Lookups.Chromosomes.get("itemsById"), function(v) {
            return {"chr_name":v.id,"chr_length":parseInt(v.chr_lengths)};
        });

        var data = {
            DATA: {
                features: [],
                edges: [],
                hash : function(feature) {
                    return feature.id;
                }
            },
            PLOT: {
                container: div,
                width : width,
                height: height,
                vertical_padding : 10,
                horizontal_padding: 10,
                enable_pan : false,
                enable_zoom : false,
                show_legend: false
            },

            GENOME: {
                DATA:{
                    key_order : key_order,
                    key_length : key_length
                },
                OPTIONS: {
                    radial_grid_line_width : 2,
                    label_layout_style:"clock",
                    label_font_style:"16px helvetica",
                    gap_degrees : 2
                }
            },

            WEDGE:[
            ],
            TICKS : {
                OPTIONS : {
                    wedge_height: 7,
                    wedge_width:0.7,
                    overlap_distance:10000000, //tile ticks at specified base pair distance
                    height : 120,
                    fill_style : tick_colors,
                    tooltip_items: hovercard_items_config,
                    tooltip_links: hovercard_links_config
                }
            },
            NETWORK:{
                DATA:{
                    data_array : []//
                },
                OPTIONS: {
                    render: true,
                    outer_padding : 10,
                    tile_nodes : Boolean(true),
                    node_overlap_distance: 3e7,
                    node_radius:3,
                    node_fill_style : tick_colors,
                    link_stroke_style : "red",
                    link_line_width:1,
                    link_alpha : 0.6,
                    node_highlight_mode : "isolate",
                    node_key : function(node) {
                        return node.label;
                    },
                    node_tooltip_items :  hovercard_items_config,
                    node_tooltip_links: hovercard_links_config,
                    link_tooltip_items :  {
                        "Target" : function(link) {
                            return "<span style=\"color:" + tick_colors(link.source) + "\">" + label_map[link.source.source.toUpperCase()] + "</span> " + link.source.label;
                        },
                        "Target Location" : function(link) {
                            return "Chr " + link.source.chr + " " + link.source.start + (link.source.end ? "-" + link.source.end : "");
                        },
                        "Predictor" : function(link) {
                            return "<span style=\"color:" + tick_colors(link.target) + "\">" + label_map[link.target.source.toUpperCase()] + "</span> " + link.target.label;
                        },
                        "Predictor Location" : function(link) {
                            return "Chr " + link.target.chr + " " + link.target.start + (link.target.end ? "-" + link.target.end : "");
                        }
                    }
                }
            }
        };

        var circle_vis = new vq.CircVis({
            DATATYPE : "vq.models.CircVisData",
            CONTENTS : data
        });
        circle_vis();
        return circle_vis;
    }

});