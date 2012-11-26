var Template = require("./templates/topbar");
var SignInModal = require("./templates/sign_in_modal");
var SignInView = require("./sign_in");
var SessionsView = require("./sessions_view");
var HangoutLink = require("./templates/hangout_link");
var AboutLink = require("./templates/about_link");
var CloudStorageView = require("../views/cloud_storage_view");

module.exports = Backbone.View.extend({

    events:{
        "click .signin": function() {
            this.$signInModal.modal("toggle");
            return false;
        }
    },

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "initHangoutLink", "initAboutLinks");

        this.$el.html(Template());

        this.initSignIn();
        _.defer(function() {
            new CloudStorageView();
        });
        _.defer(this.initHangoutLink);
        _.defer(this.initAboutLinks);

        this.$el.find(".titled").html(qed.Display.get("title") || "QED");

        var sessionsView = new SessionsView();
        this.$el.find(".sessions-container").html(sessionsView.render().el);
    },

    initHangoutLink: function() {
        var hangoutUrl = qed.Display.get("hangoutUrl");
        if (hangoutUrl) {
            this.$el.find(".hangout-container").html(HangoutLink({ "url": hangoutUrl }));
        }
    },

    initAboutLinks: function() {
        var aboutLinks = qed.Display.get("aboutLinks") || [];
        if (!_.isEmpty(aboutLinks)) {
            var UL = this.$el.find(".about-links");
            UL.empty();
            _.each(aboutLinks, function(aboutLink) {
                if (aboutLink.divider) {
                    UL.append("<li class='divider'></li>");
                    if (aboutLink.header) {
                        UL.append("<li class='nav-header'>" + aboutLink.header + "</li>");
                    }
                } else {
                    UL.append(AboutLink(aboutLink));
                }
            });
        }
    },

    initSignIn:function () {
        this.$signInModal = $("body").append(SignInModal()).find(".signin-container");

        var _this = this;
        var addAuthProviders = function(json) {
            _.each(json.providers, function (provider) {
                var sign_in_view = new SignInView({ "provider":provider });
                _this.$signInModal.find(".modal-body").append(sign_in_view.render().el);
                _this.$signInModal.find(".signout-all").click(function() {
                    sign_in_view.signout();
                });
                if (provider.id == "google") {
                    if (provider.active) _this.$el.find(".requires-google-oauth").show();
                    sign_in_view.on("signout", function() {
                        _this.$el.find(".requires-google-oauth").hide();
                    });
                }
            });
        };

        // prepare sign in process in case of 403 (Forbidden)
        var signInProcessStart = _.once(function() {
            $.ajax({
                url: "svc/auth/providers",
                type: "GET",
                dataType: "json",
                success: function(json) {
                    addAuthProviders(json);
                    _this.$signInModal.modal("show");
                    _this.$signInModal.find(".signout-all").click();
                }
            });
        });

        this.$el.ajaxError(function(event, request) {
            if (request.status == 403) signInProcessStart();
        });

        $.ajax({ url:"svc/auth/whoami", method:"GET", context:this, success:addAuthProviders });
    }
});
