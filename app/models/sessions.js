var SessionModel = Backbone.Model.extend({
    "defaults": {
        "label": "Untitled",
        "route": ""
    }
});

module.exports = Backbone.Collection.extend({
    model: SessionModel,
    url: "svc/storage/sessions"
});