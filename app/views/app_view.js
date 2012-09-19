var View = require('./view');
var TopBarView = require('./topbar_view');
var template = require('./templates/application')

module.exports = View.extend({

  afterRender: function() {
  	this.topbar = new TopBarView({ el: this.$("#navDiv") });
  }
});
