var View = require('./view');
var template = require('./templates/topbar');

module.exports = View.extend({
    id: 'top-bar',
    template: template,
    _autocompleteSources: [],

    initialize: function() {  
        _.bindAll(this,'initSearchAutocomplete','addAutocompleteSource');
    },

    afterRender: function() {
        this.initSearchAutocomplete();
        this.addAutocompleteSource();
        this.initSignIn();
    },

    initSearchAutocomplete: function() {
        var queryEl = this.$el.find("#querySearchTerm");
        var resultsModal = this.$el.find("#searchResults");
        resultsModal.modal({ backdrop: false, show: false });

        var modalBody = resultsModal.find(".modal-body");
        var me = this;

        queryEl.typeahead({
            source:function (query) {
                modalBody.empty();

                _.each(me._autocompleteSources, function(src) {
                    if (src.autocomplete) {
                        var resultBin = function(results) {
                            if (results && results.length) {
                                resultsModal.modal('show');

                                var html = [];
                                html.push("<ul class='nav nav-list'>");
                                if (src.label) html.push("<li class='nav-header'>" + src.label + "</li>");
                                _.each(_.uniq(results), function(result) {
                                    html.push("<li>" + result + "</li>");
                                });
                                html.push("</ul>");
                                modalBody.append(html.join(""));

                                modalBody.find("li").find("a").click(function() {
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

    addAutocompleteSource: function(newSource) {
        this._autocompleteSources.push(newSource);
    },

    /*
     * Configures logic for sign-in
     * Checks to see if user is authenticated (via whoami)
     * - if known user, display popover with sign in details
     * If user signs out
     * - clear session (via signout)
     * - re-enable sign-in logic
     */
    initSignIn: function() {
        var isSignedIn = true;

        $.ajax({
            url: "/svc/auth/whoami",
            method:"GET",
            context: this,
            success: function(json) {
                var firstName = json["first_name"];
                var fullName = json["full_name"];
                var lastName = json["last_name"];
                var email = json["email"];
                var profile_pic = json["profile_pic"];

                var html = "";
                html += "<div class='profile_container'>";
                html += "<img class='profile_pic' src='" + profile_pic + "' alt='No profile picture'/>";
                html += "<div class='profile_dtls'>" + fullName + "<br/><b>" + email + "</b></div>";
                html += "<div class='profile_links'>";
                html += "<a class='signout_link' href='#'>Sign Out</a>";
                html += "</div>";
                html += "</div>";

                var signInBtn = this.$el.find(".sign-in");
                signInBtn.click(function(e) {
                    if (isSignedIn) e.preventDefault();
                });
                signInBtn.popover({ placement: "bottom", title: "QED Sign In", content: html });

                $(".signout_link").live("click", function(e) {
                    e.preventDefault();
                    signInBtn.popover("destroy");
                    isSignedIn = false;
                    $.ajax({ url: "/svc/auth/signout", method: "GET" });
                });
            }
        });
    }
});
