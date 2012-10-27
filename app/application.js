var Controller = require('lib/controller');
var Router = require('lib/router');

// Application bootstrapper.
Application = {
    initialize: function() {
        _.bindAll(this, 'initLayout');

        // Ideally, initialized classes should be kept in controllers & mediator.
        this.mediator = Backbone.Mediator;
        this.Controller = Controller;
        this.router = new Router();

        if (typeof Object.freeze === 'function') Object.freeze(this);
    },

    initLayout : function() {
        this.Controller.app.layout();
    },

    initListeners : function() {
        this.mediator.subscribe('edge:select', function generateTwoD(edge, analysis, dataset) {
            var Feature = require('./models/Feature');
            var feature1 = new Feature(edge.node1);
            var feature2 = new Feature(edge.node2);
            Controller.vis[twoD](new FeatureList([feature1,feature2]));
        });
    }

}

module.exports = Application;
