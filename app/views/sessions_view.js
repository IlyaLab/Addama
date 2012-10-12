var View = require('./view');
var template = require("./templates/sessions_menu");
var SessionsLineItem = require("./templates/sessions_list_item");

module.exports = View.extend({
    template: template,
    events: {
        "click .new-session": "newSession",
        "click .open-session": "openSession",
        "click .save-session": "saveSession"
    },

    initialize:function () {
        _.bindAll(this, 'loadSessionById', 'loadSession', 'newSession', 'openSession', 'saveSession');
    },

    afterRender:function () {
        this.loadSessionById(localStorage.getItem("session_id"));

        $.ajax({
            url: "svc/storage/sessions",
            type: "GET",
            dataType: "json",
            context: this,
            success: function(json) {
                console.log("success loading sessions");
                if (json && json.items) {
                    _.each(json.items, function(item) {
                        if (!item.label) item.label = "Untitled";
                        this.$el.append(SessionsLineItem( item ));
                    }, this);
                    
                    this.$el.find(".load-session").click(this.loadSession);
                }
            },
            error: function(e,o) {
                console.log("failure loading session");
            }
        });
    },

    newSession: function(e) {
        e.preventDefault();

        console.log("TODO : Implement dialog to enter session label");
        console.log("TODO : Clear local storage of session information, create new session");
    },

    openSession: function(e) {
        e.preventDefault();

        console.log("TODO : Implement modal to list all sessions");
    },

    loadSession: function(e) {
        if (e.preventDefault) e.preventDefault();
        this.loadSessionById($(e.target).data()["id"]);
    },

    loadSessionById: function(sessionId) {
        if (sessionId) {
            console.log("loading session " + sessionId);
            $.ajax({
                url: "svc/storage/sessions/" + sessionId,
                type: "GET",
                dataType: "json",
                success: function(json) {
                    console.log("success loading " + sessionId);
                    localStorage.setItem("session_id", sessionId);
                    if (json) {
                        _.each(_.without(_.without(_.keys(json), "id"), "label"), function(key) {
                            localStorage.setItem(key, json[key]);
                        });
                    }
                },
                error: function(e,o) {
                    console.log("failure loading " + sessionId);
                }
            });
        }
    },

    saveSession: function(e) {
        e.preventDefault();

        var data = {};
        var storage_keys = _.without(_.without(_.keys(localStorage), "session_id"), "session_label");
        _.each(storage_keys, function(key) {
            data[key] = localStorage.getItem(key);
        });

        var label = localStorage.getItem("session_label");
        data["label"] = (label) ? label : "Untitled Session";
        // TODO : Capture session label...

        var sessionId = localStorage.getItem("session_id");
        var url = (sessionId) ? "svc/storage/sessions/" + sessionId : "svc/storage/sessions";

        $.ajax({
            url: url,
            type: "POST",
            data: data,
            dataType: "json",
            success: function(json) {
                console.log("success saving session: " + json.id);
                localStorage.setItem("session_id", json.id);
            },
            error: function() {
                console.log("failure saving session");
            }
        });
    }
});
