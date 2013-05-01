var Model = require('./model')

module.exports = Model.extend({

  defaults:{
  	label:''
  },

  initialize: function(){

  },

  parse: function(response) {
  	var label = resposne.split(':')[2];
  	return {label:label};
  }
  
});
