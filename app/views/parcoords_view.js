var View = require('./view');

module.exports = View.extend({

 getRenderData : function() {},

 render: function() {
 	_.bindAll(this,'render','showData');
 	this.$el.addClass('parcoords').attr('id','test');
 	return this;
 },

  showData: function() {

  	var data = new Array();
  	for (var i = 0, len = graphData.r1.length; i<len; i++) {
  		data.push({
  			'index':i,
  			'label':graphData.nByi[i],
  			'r1':graphData.r1[i],
  			'hodge':graphData.hodge[i],
  			'd':graphData.d[i],
  			'f1':graphData.f1[i]
  		});
  	}
		var pc = d3.parcoords()('#test');

		pc.dimensions(['r1','hodge','d','f1'])
		  .data(data)
		  .render()
		  .color("#000")
		  .alpha(0.2)
		  .margin({ top: 24, left: 0, bottom: 12, right: 0 })
		  .render()
		  .reorderable()
		   .brushable()
		   .on('brush', function(data){
		   	console.log('brush!');
		   });

	    pc.svg.selectAll(".parcoords-dimension")
    		.on("click", toggle_dimension);  

		function select(dimension) {
			 pc.svg.selectAll(".parcoords-dimension")
			    .filter(function(d) { return d == dimension; })
			    .classed('selected',true);
		}

		function unselect() {
			 pc.svg.selectAll(".parcoords-dimension")
			 	.classed('selected',false);
		}
		
		function toggle_dimension(dimension) {

		var dim = pc.svg.selectAll(".parcoords-dimension.selected")
				.filter(function(d) { return d == dimension; });

		if (dim[0].length > 0) {  //this was previously selected
				unselect();
				Backbone.Events.trigger('');
				console.log('previous');
			} else {	//this was not previously selected
				 unselect();
				 select(dimension);
				 Backbone.Mediator.pub('dimension:select',dimension);
			}   		 
		}

	}
});