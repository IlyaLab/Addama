var Controller = require('./controller');

module.exports = Backbone.Router.extend({
  routes: {
    '': 'home',
    'graph': 'graph',
    'pwpv': 'pwpv',
    'twoD/:f1/:f2' : 'twod',
    'oncovis' : 'oncovis'
  },

  graph: function() {
      Controller.graph.view();
  },

  pwpv: function() {
      Controller.pwpv.view();
  },

  twod: function() {
      Controller.twod.view();
  },

  oncovis: function() {
      Controller.oncovis.view();
  },

  home: function() {
      Controller.home.view();
  }
});
