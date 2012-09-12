var application = require('application');

module.exports = Backbone.Router.extend({
  routes: {
    '': 'home',
    'graph': 'graph'
  },

  graph: function() {
  	$('body').html(application.graphView.render().el);
  },

  home: function() {
    $('body').html(application.homeView.render().el);
  }
});
