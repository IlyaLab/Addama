var Model = require('./model')
var FeatureList = require('./featureList')
var EdgeList = require('./edgeList')

module.exports = Model.extend({

  defaults:{
  	node_list : FeatureList,
  	edge_list : EdgeList
  },

  initialize: function(){
  	this.nodes = new FeatureList
  	this.edges = new EdgeList

  }


  
});
