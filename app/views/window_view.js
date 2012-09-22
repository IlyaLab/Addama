var View = require('./view');
var template = require('./templates/window');

module.exports = View.extend({


  template:template,
  
  getRenderData : function() {},

  afterRender: function() {
    this.$el.addClass('row');
    // see http://jqueryui.com/demos/dialog/
    this.$el.find(".windowcontainer").dialog();
  }


});
