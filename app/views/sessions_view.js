var LineItemTemplate = require("../views/templates/line_item");
var SessionLabelTemplate = require("../views/templates/sessions_label");
var ActiveSessionModel = require("../models/active_session");

module.exports = Backbone.View.extend({

    initialize:function () {
        _.bindAll(this, "loadSessions", 'saveSession', "loadModel");
                
        $(document.body).append(SessionLabelTemplate());
        
        $(".sessions-labeler button.save-session").click(this.saveSession);
        $("a.new-session").live("click", function() {
            $(".sessions-labeler").modal("show");
        });
        $("a.load-session").live("click", function(e) {
            var sessionId = $(e.target).data("id");
            if (sessionId) {
                qed.Router.navigate("#s/" + sessionId, {trigger: true});
            }
        });

        this.model = qed.Sessions.All;
        this.model.on("load", this.loadSessions);
        this.loadModel();
    },

    loadSessions: function() {
        this.$el.empty();
        
        var items = this.model.get("items");
        _.each(items, function(item) {
            if (!item.label) item.label = "Untitled";
            this.$el.append(LineItemTemplate({ "a_class": "load-session", "id": item.id, "label": item.label }));
        }, this);
    },

    saveSession: function() {
        var label = $(".sessions-labeler").find(".session-label").val();
        $(".sessions-labeler").modal("hide");

        qed.Sessions.Active = new ActiveSessionModel({
            "label": label || "Untitled",
            "history": Backbone.history.fragment
        });
        qed.Sessions.Active.save({}, { success: this.loadModel });
    },

    loadModel: function() {
        var _this = this;
        _.defer(function() {
            _this.model.fetch({
                url: "svc/storage/sessions",
                success: function() {
                    _this.model.trigger("load");
                }
            });
        });
    }
});
