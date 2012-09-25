var View = require('./view');
var template = require('./templates/graph');
var Graph = require('../models/graph');
var TreeChart = require('../vis/treeChart');
var PC = require('./parcoords_view');

module.exports = View.extend({

  model : Graph,
  template:template,

    events: {
        "click .graph-controls-reset": "resetControls",
        "click .toggle-labels .toggle-on": "showLabels",
        "click .toggle-labels .toggle-off": "hideLabels",
        "click .toggle-lines .toggle-on": "showLines",
        "click .toggle-lines .toggle-off": "hideLines",
        "click .toggle-on, .toggle-off": "toggleActive",
        "click #dl-straight, #dl-diagonal, #dl-diagonal-directed": "toggleDynLayout",
        "click #dl-straight": "layoutStraight",
        "click #dl-diagonal": "layoutDiagonal",
        "click #dl-diagonal-directed": "layoutDiagonalDirected",
        "click #dimensions-x a": "changeXAxis",
        "click #dimensions-y a": "changeYAxis",
        "click #colorby-nodes a": "colorByNodes",
        "click #colorby-edges a": "colorByEdges"
    },

  initialize : function() {
      _.bindAll(this, 'afterRender', 'renderGraph', 'resetControls',
                  'showLabels', 'hideLabels', 'showLines', 'hideLines',
                  'toggleActive', 'toggleDynLayout',
                  'layoutStraight', 'layoutDiagonal', 'layoutDiagonalDirected',
                  'changeXAxis', 'changeYAxis', 'colorByNodes', 'colorByEdges');

  },
  
  afterRender: function() {
    var _this = this;
    this.$el.addClass('row-fluid');
    var analysisid = this.model.get('analysis_id');
    var split_d_id = this.model.get('dataset_id').split("_");
    var s_value = (split_d_id.length == 1 ? -1 : split_d_id[split_d_id.length-1])
    
    var slider_options = {};
    
    switch(analysisid){
      case "rf-ace":
        slider_options.max=40;
        slider_options.step=1;
        slider_options.value=s_value != -1 ? s_value : 16;
        slider_options.change=function(event, ui) {
          qed.app.router.navigate("/rf-ace/cons_predictor_12800_cutoff_"+ui.value+".0/graph",{trigger: true,replace:false}); 
        }
        break;
      case "pairwise":
        slider_options.max=1;
        slider_options.step=.1;
        slider_options.value=s_value != -1 ? s_value : .3;
        slider_options.change=function(event, ui) {
          qed.app.router.navigate("/pairwise/continuous_pwpv_"+ui.value+"/graph",{trigger: true,replace:false}); 
        }
        break;
      case "mds":
        slider_options.disabled=true;
        this.$el.find(".subset-btn").removeClass("disabled").click( function (){qed.app.router.navigate("/mds/fig3/graph",{trigger: true,replace:false}); } );
      break;
    }

    this.$el.find(".edgeslider").slider(slider_options);
    this.model.fetch().done(_this.renderGraph);
  },

  renderGraph: function(options) {
      var _this = this;
      var parentDiv = this.$el.find('.graph-container'),
      w= parentDiv.width(),
      h= parentDiv.height();
      var vis_options = this.model.defaultParameters();
      
      var x = vis_options.x || 'r1',
       y = vis_options.y || 'hodge',
       edgeRouting = vis_options.edgeRouting || 'straight';

      var edge_scale = d3.scale.log().domain(d3.extent(_this.model.getEdgesArray(),function(a) { return a[2];})).range([0.2,1.0]);
      var edgeO = function(edge) {
          return edge_scale(edge.weight);
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
                    .edgeRoute(edgeRouting)
                    .on('node',nodeClicked)
                    .on('edge',edgeClicked);

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

      function nodeClicked(node) {
        Backbone.Mediator.publish('feature:select', new Feature(node));
      }

      function edgeClicked(edge) {
        Backbone.Mediator.publish('edge:select', new Edge(edge));
      }
  },
    
    showLabels: function(ev) {
        console.log("showLabels");
    },

    hideLabels: function(ev) {
        console.log("hideLabels");
    },

    showLines: function() {
        console.log("showLines");
    },

    hideLines: function() {
        console.log("hideLines");
    },

    resetControls: function() {
        console.log("resetControls");
    },

    toggleActive: function(ev) {
        var el = ev.target;
        if (!$(el).hasClass("active")) {
            $(el.parentNode).find("button").toggleClass("active");
        }
    },

    toggleDynLayout: function(ev) {
        $(".dynamic-layout .active").removeClass("active");
        $(ev.target).addClass("active");
    },

    layoutStraight: function(ev) {
        console.log("layoutStraight");
    },

    layoutDiagonal: function(ev) {
        console.log("layoutDiagonal");
    },

    layoutDiagonalDirected: function(ev) {
        console.log("layoutDiagonalDirected");
    },

    changeXAxis: function(ev) {
        ev.preventDefault();
        console.log("changeXAxis:" + $(ev.target).html());
    },

    changeYAxis: function(ev) {
        ev.preventDefault();
        console.log("changeYAxis:" + $(ev.target).html());
    },

    colorByNodes: function(ev) {
        ev.preventDefault();
        console.log("colorByNodes:" + $(ev.target).html());
    },

    colorByEdges: function(ev) {
        ev.preventDefault();
        console.log("colorByEdges:" + $(ev.target).html());
    }

});
