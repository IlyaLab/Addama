var Controller = require('lib/controller');
var Router = require('lib/router');
var Router = require('lib/router');   

// Application bootstrapper.
Application = {
  initialize: function() {
	    
    // Ideally, initialized classes should be kept in controllers & mediator.
    // If you're making big webapp, here's more sophisticated skeleton
    // https://github.com/paulmillr/brunch-with-chaplin
    this.initLayout();

    this.initControllers();
    this.initRouters();

    this.initMediators();
    
    if (typeof Object.freeze === 'function') Object.freeze(this);
  },

  initLayout : function() {
  	
  	Controller.app.layout();
  },

  initControllers : function () {
	this.Controller = Controller;
  },

  initRouters : function () {  
  	
  	 this.router = new Router();
  },

  initMediators : function() {
  	this.mediator = Backbone.Mediator;
  }

}

module.exports = Application;
