var View = require('./view');
var template = require('./templates/circ');
var Graph = require('../models/graph');
var PC = require('./parcoords_view');

module.exports = View.extend({

  model : Graph,
  template:template,

  initialize : function() {
      _.bindAll(this,'afterRender','renderCirc');
  },
  
  afterRender: function() {
    var _this = this;
    this.$el.addClass('row-fluid');
    this.model.fetch().done(_this.renderCirc);
  },

  renderCirc: function(options) {
      var _this = this;
      var parentDiv = this.$el.find('.circ-container'),
      div = parentDiv.get(0);

      var width = parentDiv.height(),
         height = parentDiv.height(),
         ring_radius = width / 20;

      var vis_options = this.model.defaultParameters(),
           chrom_info = qed.vis.genome;

      var circle_vis = new vq.CircVis();
   
      var data = {
            GENOME: {
                DATA:{
                    key_order : chrom_info.chr_labels,
                    key_length : chrom_info.chr_lengths
                },
                OPTIONS: {
                    radial_grid_line_width: 1,
                    label_layout_style : 'clock',
                    label_font_style : '18pt helvetica'
                }
            },
            TICKS : {
                DATA : {
                    data_array : []
                },
                OPTIONS :{
                    display_legend : false,
                    // listener : wedge_listener,
                    // stroke_style :stroke_style,
                    // fill_style : function(tick) {return re.plot.colors.node_colors(tick.source); },
                    // tooltip_links :re.display_options.circvis.tooltips.feature_links,
                    // tooltip_items :  re.display_options.circvis.tooltips.feature     //optional
                }
            },
            PLOT: {
                width : width,
                height :  height,
                horizontal_padding : 30,
                vertical_padding : 30,
                container : div,
                enable_pan : false,
                enable_zoom : false,
                show_legend: false,
                legend_include_genome : false,
                legend_corner : 'ne',
                legend_radius  : width / 15
            },
            WEDGE:[
                {
                    PLOT : {
                        height : ring_radius,
                        type :   'scatterplot'
                    },
                    DATA:{
                        data_array : []
                    },
                    OPTIONS: {
                        legend_label : 'Information Gain' ,
                        legend_description : '',
                        outer_padding : 6,
                        base_value : 0,
                        min_value : -1,
                        max_value : 1,
                        radius : 4,
                        draw_axes : false,
                        shape:'dot',
                    //     fill_style  : function(feature) {
                    //         return re.plot.colors.link_sources_colors([feature.sourceNode.source,feature.targetNode.source]);
                    //     },
                    // //     stroke_style : stroke_style,
                    //     background_style: re.display_options.circvis.rings.color_background,
                    //     tooltip_items : unlocated_tooltip_items,
                    //     listener : initiateDetailsPopup
                    }
                }
            ],
            NETWORK:{
                DATA:{
                    data_array : []
                },
                OPTIONS: {
                    outer_padding : 6,
                    node_highlight_mode : 'isolate',
                    node_fill_style : 'ticks',
                    // node_stroke_style : stroke_style,
                    link_line_width : 2,
                    node_key : function(node) { 
                            return node['id'];
                    },
    //                node_listener : wedge_listener,
    //                link_listener: initiateDetailsPopup,
                    // link_stroke_style : function(link) {
                    //     return re.plot.colors.link_sources_colors([link.sourceNode.source,link.targetNode.source]);},
                    constant_link_alpha : 0.7,
                    // node_tooltip_items :   re.display_options.circvis.tooltips.feature,
                    // node_tooltip_links : re.display_options.circvis.tooltips.feature_links,
                    tile_nodes: true,
                    node_overlap_distance : 10000,
                    // link_tooltip_items :  link_tooltip_items
                }
            }
        };
      
      var dataObject = {DATATYPE : "vq.models.CircVisData", CONTENTS : data};
      circle_vis.draw(dataObject);

      var filter = this.$el.find('.filter-container');
      var pc_view = new PC({model:this.model});
      filter.html(pc_view.render().el);
      pc_view.showData();

      Backbone.Mediator.subscribe('dimension:select',dimension_selected, this, false );

      function dimension_selected(dimension) {
        var scale = d3.scale.linear().domain(d3.extent(graphData[dimension])).range([0.1,1.0]);
      //   treeChart.nodeOpacity(function(node) { return scale(node[dimension]);})
      //   treeChart.redraw();
      }
     
  }

});