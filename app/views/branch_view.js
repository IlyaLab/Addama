var View = require('./view');
var template = require('./templates/branch');
var BranchMatrix = require('../models/branchMatrix');

module.exports = View.extend({

  model:BranchMatrix,
  template:template,

  initialize : function() {
  	_.bindAll(this, 'getRenderData', 'afterRender', 'renderGrid');
  },
  
  getRenderData : function() {},

  afterRender: function() {
  	var _this = this;
    this.$el.addClass('row-fluid');
    //this.model.bind('load',_this.renderGrid);
    this.model.on('load',_this.renderGrid);
  },

  renderGrid : function(){
    var me = this;
    var scatdata = this.model.getD3Data();
    var length = scatdata.length;
    var height = 400;
    var width = 1000;
    var x = function(d) {
          return d.r1*(width/length);
      };
    var y = function(d) {
          return d.r2*(height/length);
      };
   
    var colors = ["#D7191C", "#FDAE61", "#FFFFBF", "#ABD9E9", "#2C7BB6"];
    var color = function(d){
        if ( ! colors.hasOwnProperty(d.termcat)){
          console.log("bad color "+ (d.termcat-1));
        }
        return colors[d.termcat-1];
      };

    var clearstate = function ()
    {
      $(".case-name").html("");
        $(".branch-output").html("");
        $(".pathway-output").html("");
        me.pc.color("#447");
        me.pc.clear("highlight");
        me.pc.render();
    }
    var showpathways=function(data){
      if (data.length==0){
        $(".pathway-output").html("No Pathways Found.");
        return;
      }
      $(".pathway-output").html("<div style='font-size: 14px;'>Pathways Containing "+data[0].GENE+"</div>");
      var grid = d3.select(".pathway-output");
      grid.selectAll("div")
        .data(data)
        .enter()
        .append("div")
        .text(function(d){ return d.PATHWAY;});

    };
    console.log("scatter");
    var svg = d3.select(".scat-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .on("click", clearstate);
      //.margin({ top: 120, left: 80, bottom: 80, right: 80 });
    
    svg.selectAll("circle")
      .data(scatdata)
      .enter()
      .append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 10)
      .attr("fill",color)
      .attr("stroke",color)
      .style('stroke-opacity', 0.8)
      .style('fill-opacity', 0.8)
      .on("click", function(d,i){
          clearstate();
          var features = me.model.getTopFeaturs(d.n);
          var blue_to_brown = d3.scale.pow()
            .exponent(3.5)
            .domain([features[features.length-1][1], features[0][1]])
            .range(["#447", "red"])
            .interpolate(d3.interpolateLab);
          me.pc.color(function(d){ return blue_to_brown(d[i]); });
          $(".case-name").html("Top Features for "+ d.n);
          var output = d.n + " : ";
          var highlight = [];
          for (var j = 0; j < Math.min(features.length, 20); j++) {
            highlight.push([features[j][0],features[j][1]]);
            
          }
          //me.pc.highlight(me.model.filterFeatures(highlight));
          var grid = d3.select(".branch-output");

          var highlightf = function(d){me.pc.highlight(me.model.filterFeatures([d[0]]));};
          
          grid.selectAll("div")
            .data(highlight)
            .enter()
            .append("div")
            .text(function(d){return d[0]+", "+d[1];})
            .style("color",function(d){ return blue_to_brown(d[1]); })
            .on("click", function(d){
              $(".pathway-output").html("");
              highlightf(d);
              d3.tsv("/svc/data/analysis/genesets/genesets?rows="+d[0].split(":")[2], showpathways);
              })
            .on("mouseover",highlightf)
            .on("mouseout",function(){me.pc.clear("highlight");});

          //$(".branch-output").html(output);
          me.pc.render();
          d3.event.stopPropagation();
        });

    /*svg.selectAll("text")
      .data(scatdata)
      .enter()
      .append("text")
      .text(function(d) {
        return d.n;
      })
      .attr("x", x)
      .attr("y", y)
      .attr("font-family", "sans-serif")
      .attr("font-size", "10px")
      .style('stroke-opacity',.8)
      .style('fill-opacity',.8)
      .attr("fill", "grey");*/



    var pcdata = this.model.get('branches');
    var ignore_keys = ['label','type','source','feature_id','nByi',"feature"];
    var keys = _.difference(Object.keys(pcdata[0]),ignore_keys);

    me.pc = d3.parcoords()(".pc-container");

    me.pc.dimensions(keys)
      .data(pcdata)
      //.render()
      .color("#447")
      //.alpha(0.8)
      .margin({ top: 0, left: 0, bottom: 0, right: 0 })
      .render()/*
      .reorderable()
      .brushable()
      .on('brush', function(data){
      me.model.filterNodes(data);
      })*/;
		
	}

});