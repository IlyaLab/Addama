var application = require('application');

$(function () {
    qed = {app:application};
    application.initialize();
    Backbone.history.start();
});
