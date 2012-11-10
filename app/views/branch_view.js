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
	  var container = this.$el.find(".pc-container")[0];


    var me = this;
    var data = this.model.get('data');
    var ignore_keys = ['label','type','source','feature_id','nByi',"feature"];
    var keys = _.difference(Object.keys(data[0]),ignore_keys);

  var pc = d3.parcoords()(".pc-container");

  pc.dimensions(keys)
    .data(data)
    .render()
    .color("#000")
    .alpha(0.3)
    .margin({ top: 120, left: 80, bottom: 80, right: 80 })
    .render()
    //.reorderable()
    //.brushable()
    /*.on('brush', function(data){
      me.model.filterNodes(data);
    })*/;
		
	}

});