var Node = require('./node')

module.exports = Node.extend({

  defaults:{
  	type:'',
  	source:'',
  	//dataset:'',

  },
  
	initialize: function() {

	},
	parse: function(response){
		var feature_array = response.split(':');
		return {
			type:feature_array[0],
				source:feature_array[1]
			};
	}


});
