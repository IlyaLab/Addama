var Model = require('./model')
var FeatureList = require('./featureList')
var EdgeList = require('./edgeList')

module.exports = Model.extend({


  initialize: function(){
  	this.nodes = new FeatureList
  	this.edges = new EdgeList

  },

  sync : function(method, model) {
  	this.nodes.reset(graph.nByi);
  	this.edges.reset(graph.adj); 
  }

});
