var View = require('./view');

module.exports = View.extend({

 getRenderData : function() {},

 render: function() {
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

		}
});