var app = require('application');

module.exports = Backbone.Router.extend({
  routes: {
    '': 'home',
    'graph': 'graph'
  },

  graph: function() {
      app.Controller.graph.view();
  },

  home: function() {
      app.Controller.home.view();
  }
});
