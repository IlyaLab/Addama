var View = require('./view');
var template = require('./templates/graph');

module.exports = View.extend({

  id: 'graph-view',
  template: template,

  getRenderData : function() { return {'container':'graph'};},

  afterRender: function() {
  	
  }

});
