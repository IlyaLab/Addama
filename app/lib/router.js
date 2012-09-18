var Controller = require('./controller');

module.exports = Backbone.Router.extend({
  routes: {
    '': 'home',
    'graph': 'graph',
    'twoD/:f1/:f2' : 'twod'
  },

  graph: function() {
      Controller.graph.view();
  },

  twod: function() {
      Controller.twod.view();
  },

  home: function() {
      Controller.home.view();
  }
});
