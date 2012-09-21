var View = require('./view');
var template = require('./templates/topbar');

module.exports = View.extend({
    id: 'top-bar',
    template: template,
    _autocompleteSources: [],

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
    }
});
