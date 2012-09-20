var View = require('./view');
var template = require('./templates/graph');
var Graph = require('../models/graph');
var TreeChart = require('../vis/treeChart');
var PC = require('./parcoords_view');

module.exports = View.extend({

  template:template,

  initialize : function() {
      _.bindAll(this,'cleanData','afterRender');
  },
  
  cleanData : function() {
  
    this.edges = graphData.adj;
    var node_data =  new Array();
    Object.keys(graphData).forEach(function(a) { 
        if (a === 'adj' || a ==='iByn')   return;
        node_data[a] = _.clone(graphData[a]);
      });
    node_data.label = node_data.nByi.map(function(f) { return f.split(':')[2];});
    var node_objs = new Array();
    var data_keys = _.keys(node_data);  //keys of the data structure    
    var obj, i,
     key_len = data_keys.length;

    node_objs = _.range(node_data[data_keys[0]].length)
                    .map(function(row) {
                      obj={};
                        for (i=0; i < key_len; i++)  obj[data_keys[i]] = node_data[data_keys[i]][row];
                          return obj;
                      });  

    this.graphData = node_objs;
  },

  afterRender: function() {
    this.$el.addClass('row-fluid');
  },

  renderGraph: function() {
    this.cleanData();
    var parentDiv = this.$el.find('.graph-container'),
    w= parentDiv.width(),
    h= parentDiv.height();
  
      var edge_scale = d3.scale.log().domain(d3.extent(graphData.adj,function(a) { return a[2];})).range([0.2,1.0]);
      var edgeO = function(edge) {
          return edge_scale(edge[2]);
      };

  		var treeChart = TreeChart({
                			width:w, 
                			height:h,   			
                			nodes:{
                          data : this.graphData,
                					y: 'hodge',
                					x: 'r1'
                				},
                        edges: {
                          data: this.edges
                        }
                		})
                    .edgeOpacity(edgeO);

  		d3.select('.graph-container')
              .call(treeChart);

      var filter = this.$el.find('.filter-container');
      var pc_view = new PC();
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
