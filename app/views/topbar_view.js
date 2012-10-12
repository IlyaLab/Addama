var View = require('./view');
var template = require('./templates/topbar');
var SignInModal = require("./templates/sign_in_modal");
var SignInView = require("./sign_in");
var SessionsView = require("./sessions_view");

module.exports = View.extend({
    id:'top-bar',
    template:template,
    _autocompleteSources:[],
    sessionsView: new SessionsView(),

    events:{
        "click .signin": function() {
            this.$signInModal.modal("toggle");
            return false;
        }
    },

    initialize:function () {
        _.bindAll(this, 'initSearchAutocomplete', 'addAutocompleteSource');
    },

    afterRender:function () {
        this.initSearchAutocomplete();
        this.initSignIn();

        this.$el.find(".sessions-container").html(this.sessionsView.render().el);
    },

    initSearchAutocomplete:function () {
        var queryEl = this.$el.find("#querySearchTerm");
        var resultsModal = this.$el.find("#searchResults");
        resultsModal.modal({ backdrop:false, show:false });

        var modalBody = resultsModal.find(".modal-body");
        var me = this;

        queryEl.typeahead({
            source:function (query) {
                modalBody.empty();

                _.each(me._autocompleteSources, function (src) {
                    if (src.autocomplete) {
                        var resultBin = function (results) {
                            if (results && results.length) {
                                resultsModal.modal('show');

                                var html = [];
                                html.push("<ul class='nav nav-list'>");
                                if (src.label) html.push("<li class='nav-header'>" + src.label + "</li>");
                                _.each(_.uniq(results), function (result) {
                                    html.push("<li>" + result + "</li>");
                                });
                                html.push("</ul>");
                                modalBody.append(html.join(""));

                                modalBody.find("li").find("a").click(function () {
                                    resultsModal.modal("hide");
                                });
                            }
                        };

                        src.autocomplete(query, resultBin);
                    }
                });
            }
        });
    },

    addAutocompleteSource:function (newSource) {
        this._autocompleteSources.push(newSource);
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
