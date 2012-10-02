var View = require('./view');
var template = require('./templates/topbar');
var SignInModal = require("./templates/sign_in_modal");
var SignInView = require("./sign_in");

module.exports = View.extend({
    id:'top-bar',
    template:template,
    _autocompleteSources:[],

    events:{
        "click .sign-in": function(e) {
            e.preventDefault();
            this.$signInModal.modal("toggle");
        }
    },

    initialize:function () {
        _.bindAll(this, 'initSearchAutocomplete', 'addAutocompleteSource');
    },

    afterRender:function () {
        this.initSearchAutocomplete();
        this.initSignIn();
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

        $.ajax({
            url:"/svc/auth/whoami",
            method:"GET",
            context:this,
            success:function (json) {
                _.each(json.providers, function (provider) {
                    var sign_in_view = new SignInView({ "provider":provider });
                    this.$signInModal.find(".modal-body").append(sign_in_view.render().el);
                    this.$signInModal.find(".signout-all").click(function() {
                        sign_in_view.signout();
                    });
                }, this);
            }
        });
    }
});
