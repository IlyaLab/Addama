var View = require('./view');
var template = require('./templates/circ');
var GFList = require('../models/genomic_featureList');
var PC = require('./parcoords_view');

module.exports = View.extend({
  template:template,

  initialize : function(options) {
      _.extend(this, options);
      _.bindAll(this,'afterRender','renderCirc','loadData');
      this.renderCirc = _.once(this.renderCirc);
      this.model.on("load", this.loadData);
  },
  
  afterRender: function() {
      this.$el.addClass('row-fluid');
  },

  renderCirc: function(options) {
      var _this = this;
      var parentDiv = this.$el.find('.circ-container'),
      div = parentDiv.get(0);

      $('.circ-container',this.$el).attr('id',this.model.dataset_id);

      var width = parentDiv.height(),
         height = parentDiv.height(),
         ring_radius = width / 10;

      //var vis_options = this.model.defaultParameters(),
        var hovercard_config = {
          Feature: 'label',
          Location: function(feature) { 
            return 'Chr ' + feature.chr + ' ' + feature.start + (feature.end ? '-' + feature.end : '');
          }
        };

        _.each(this.model.getAnnotationHeaders(), function(header) {
          hovercard_config[header] = header;
        });

      //var extent = d3.extent(features,function(f) { return f['ig'];});
      var extent = [0,0.5];
      var color_scale = d3.scale.linear().domain(extent).range(['green','red']);
      var fill_style = function(feature) { return color_scale(feature.ig);};

      var circle_vis = new vq.CircVis();
   
      var data = {
            GENOME: {
                DATA:{
                    key_order :_.keys(qed.Lookups.Chromosomes.get("itemsById")),
                    key_length :_.map(_.values(qed.Lookups.Chromosomes.get("itemsById")), function(v) {return parseInt(v["chr_lengths"])})
                },
                OPTIONS: {
                    label_layout_style : 'clock',
                    label_font_style : '18pt helvetica',
                     gap_degrees : 2
                }
            },
            TICKS : {
                DATA : {
                    data_array : []
                },
                OPTIONS :{
                    wedge_height: 8,
                    wedge_width:0.7,
                    overlap_distance:10000000, //tile ticks at specified base pair distance
                    height : 80,
                    tooltip_items : hovercard_config
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
                        data_array : [],
                        value_key : 'ig'
                    },
                    OPTIONS: {
                        legend_label : 'Information Gain' ,
                        legend_description : '',
                        outer_padding : 6,
                        base_value : Math.min(0,(extent[1]-extent[0])/2),
                        min_value : extent[0]*0.8 ,
                        max_value : extent[1]*1.2,
                        radius : 4,
                        draw_axes : true,
                        shape:'dot',
                         fill_style  : fill_style,
                        stroke_style : 'none',
                        tooltip_items : hovercard_config
                    //     tooltip_items : unlocated_tooltip_items,
                    //     listener : initiateDetailsPopup
                    }
                }
            ]
    //         NETWORK:{
    //             DATA:{
    //                 data_array : []
    //             },
    //             OPTIONS: {
    //                 outer_padding : 6,
    //                 node_highlight_mode : 'isolate',
    //                 node_fill_style : 'ticks',
    //                 // node_stroke_style : stroke_style,
    //                 link_line_width : 2,
    //                 node_key : function(node) { 
    //                         return node['id'];
    //                 },
    // //                node_listener : wedge_listener,
    // //                link_listener: initiateDetailsPopup,
    //                 // link_stroke_style : function(link) {
    //                 //     return re.plot.colors.link_sources_colors([link.sourceNode.source,link.targetNode.source]);},
    //                 constant_link_alpha : 0.7,
    //                 // node_tooltip_items :   re.display_options.circvis.tooltips.feature,
    //                 // node_tooltip_links : re.display_options.circvis.tooltips.feature_links,
    //                 tile_nodes: true,
    //                 node_overlap_distance : 10000,
    //                 // link_tooltip_items :  link_tooltip_items
    //             }
            // }
        };
      
      var dataObject = {DATATYPE : "vq.models.CircVisData", CONTENTS : data};
      circle_vis.draw(dataObject);

      // var filter = this.$el.find('.filter-container');
      // var pc_view = new PC({model:this.model});
      // filter.html(pc_view.render().el);
      // pc_view.showData();

      // Backbone.Mediator.subscribe('dimension:select',dimension_selected, this, false );

      // function dimension_selected(dimension) {
      //   var scale = d3.scale.linear().domain(d3.extent(graphData[dimension])).range([0.1,1.0]);
      // //   treeChart.nodeOpacity(function(node) { return scale(node[dimension]);})
      // //   treeChart.redraw();
      // }
     this.vis = circle_vis;
  },

  loadData : function() {
      this.renderCirc();//it can only be executed once, so it's safe.
      var features = this.model.toJSON();

      this.vis.addNodes(features);
      
  }

});