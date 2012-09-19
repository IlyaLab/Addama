var View = require('./view');
var template = require('./templates/topbar');

module.exports = View.extend({
  id: 'top-bar',
  template: template,

    events:{
        'click .dropdown-menu a':function(source) {
            var hrefRslt = source.target.getAttribute('href');
            Backbone.history.navigate(hrefRslt, {trigger:true});
            //Cancel the regular event handling so that we won't actual change URLs
            //We are letting Backbone handle routing
            return false;
        }
    }

});
