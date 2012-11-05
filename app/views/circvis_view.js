var View = require('./view');
var template = require('./templates/circ');

module.exports = View.extend({
    template:template,
    className:"row-fluid",

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, 'loadData');
        this.model.on("load", this.loadData);
    },

    loadData:function () {
        var features = this.model.get("graph").get("nodes");
        var vis = this.getCirc();
        vis.addNodes(features);
    },

    getCirc:function () {
        var parentDiv = this.$el.find('.circ-container');
        var div = parentDiv.get(0);

        var width = parentDiv.height();
        var height = parentDiv.height();

        var hovercard_config = {
            Feature:'label',
            Location:function (feature) {
                return 'Chr ' + feature.chr + ' ' + feature.start + (feature.end ? '-' + feature.end : '');
            }
        };

        var annotations = qed.Annotations[this.model.get("dataset_id")] || {};
        if (!_.isEmpty(annotations)) {
            var headers = _.keys(annotations[_.first(_.keys(annotations))]);
            _.each(headers, function (header) {
                hovercard_config[header] = header;
            });
        }

        var extent = [0, 0.5];
        var color_scale = d3.scale.linear().domain(extent).range(['green', 'red']);

        var data = {
            GENOME:{
                DATA:{
                    key_order:_.keys(qed.Lookups.Chromosomes.get("itemsById")),
                    key_length:_.map(qed.Lookups.Chromosomes.get("itemsById"), function (obj, chr) {
                        return {chr_name:chr, chr_length:parseInt(obj["chr_lengths"])};
                    })
                },
                OPTIONS:{
                    label_layout_style:'clock',
                    label_font_style:'18pt helvetica',
                    gap_degrees:2
                }
            },
            TICKS:{
                DATA:{
                    data_array:[]
                },
                OPTIONS:{
                    wedge_height:8,
                    wedge_width:0.7,
                    overlap_distance:10000000, //tile ticks at specified base pair distance
                    height:80,
                    tooltip_items:hovercard_config
                }
            },
            PLOT:{
                width:width,
                height:height,
                horizontal_padding:30,
                vertical_padding:30,
                container:div,
                enable_pan:false,
                enable_zoom:false,
                show_legend:false,
                legend_include_genome:false,
                legend_corner:'ne',
                legend_radius:width / 15
            },
            WEDGE:[
                {
                    PLOT:{
                        height:(width / 10),
                        type:'scatterplot'
                    },
                    DATA:{
                        data_array:[],
                        value_key:'ig'
                    },
                    OPTIONS:{
                        legend_label:'Information Gain',
                        legend_description:'',
                        outer_padding:6,
                        base_value:Math.min(0, (extent[1] - extent[0]) / 2),
                        min_value:extent[0] * 0.8,
                        max_value:extent[1] * 1.2,
                        radius:4,
                        draw_axes:true,
                        shape:'dot',
                        fill_style:function (feature) {
                            return color_scale(feature.ig);
                        },
                        stroke_style:'none',
                        tooltip_items:hovercard_config
                    }
                }
            ]
        };

        var circle_vis = new vq.CircVis();
        circle_vis.draw({
            DATATYPE:"vq.models.CircVisData",
            CONTENTS:data
        });
        return circle_vis;
    }

});