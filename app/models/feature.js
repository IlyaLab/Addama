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
		var label = response.label;
		var data = labels.split(':');
		this.type = data[0];
		this.source = data[1];
		this.text = data[2];
		this.values = response.values;
		return {
			type:feature_array[0],
				source:feature_array[1]
			};
	}


});
