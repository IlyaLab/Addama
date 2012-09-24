var Model = require('./model');

module.exports = Model.extend({

  defaults: {
    source: '',
    target: '',
    weight: NaN,
    directed: false
  },

  parse: function(response) {
    return {
      source: response[0],
      target: response[1],
      weight: NaN || response[2]
    };
  }

});