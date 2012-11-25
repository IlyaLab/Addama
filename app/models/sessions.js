var SessionModel = require("../models/session");

module.exports = Backbone.Collection.extend({
    model: SessionModel,
    url: "svc/storage/sessions"
});