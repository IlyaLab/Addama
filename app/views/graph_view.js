var View = require('./view');
var template = require('./templates/graph');
var Graph = require('../models/graph');
var TreeChart = require('../vis/treeChart');
var PC = require('./parcoords_view');

module.exports = View.extend({

  model : Graph,
  template:template,

  initialize : function() {
      _.bindAll(this,'afterRender','renderGraph');
  },
  
  afterRender: function() {
    var _this = this;
    this.$el.addClass('row-fluid');
    this.model.fetch().done(_this.renderGraph);
  },

  renderGraph: function(options) {
      
      var parentDiv = this.$el.find('.graph-container'),
      w= parentDiv.width(),
      h= parentDiv.height();
      var vis_options = this.model.defaultParameters();
      
      var x = vis_options.x || 'r1',
       y = vis_options.y || 'hodge',
       edgeRouting = vis_options.edgeRouting || 'straight';

      var edge_scale = d3.scale.log().domain(d3.extent(graphData.adj,function(a) { return a[2];})).range([0.2,1.0]);
      var edgeO = function(edge) {
          return edge_scale(edge[2]);
      };

  		var treeChart = TreeChart({
                          			width:w, 
                          			height:h,   			
                          			nodes:{
                                    data : this.model.getNodesArray(),
                          					y: y,
                          					x: x
                          			},
                                edges: {
                                    data: this.model.getEdgesArray()
                                }
                		  })
                    .edgeOpacity(edgeO)
                    .edgeRoute(edgeRouting);

  		d3.select('.graph-container')
              .call(treeChart);

      var filter = this.$el.find('.filter-container');
      var pc_view = new PC({model:this.model});
      filter.html(pc_view.render().el);
      pc_view.showData();

      Backbone.Mediator.subscribe('dimension:select',dimension_selected, this, false );

      function dimension_selected(dimension) {
        var scale = d3.scale.linear().domain(d3.extent(graphData[dimension])).range([0.1,1.0]);
        treeChart.nodeOpacity(function(node) { return scale(node[dimension]);})
        treeChart.redraw();
      }
     
  }

});
