var Model = require('./model')

module.exports = Model.extend({

  defaults:{
  	node1: '',
  	node2: '',
  	weight:-1,
  	directed: false
  },

  initialize: function(){


  },

  parse: function(response) {
  	return {
  			node1:response[0],
  			node2:response[1],
  			weight:response[2]
  			};
  }


  
});
