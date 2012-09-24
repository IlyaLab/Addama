var Controller = require('lib/controller');
var Router = require('lib/router');

// Application bootstrapper.
Application = {
  initialize: function() {
     _.bindAll(this,'initLayout','initControllers','initRouters','initMediators');

    var me = this;
    
    // Ideally, initialized classes should be kept in controllers & mediator.
      
      me.initLayout();
      me.initMediators();
      me.initControllers();
      me.initRouters();

      if (typeof Object.freeze === 'function') Object.freeze(this);
   
  },

  initLayout : function() { 	
  	Controller.app.layout();
  },

  initControllers : function() {
	  this.Controller = Controller;
  },

  initRouters : function() {  
  	 this.router = new Router();
  },

  initMediators : function() {
  	this.mediator = Backbone.Mediator;
  },
  
  initListeners : function() {
    this.mediator.subscribe('edge:select', function generateTwoD(edge,analysis,dataset){
      var Feature = require('./models/Feature');
      var feature1 = new Feature(edge.node1);
      var feature2 = new Feature(edge.node2);
      Controller.vis[twoD](new FeatureList([feature1,feature2]));
    });
  }

}

module.exports = Application;
