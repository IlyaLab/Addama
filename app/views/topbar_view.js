var View = require('./view');
var template = require('./templates/topbar');

module.exports = View.extend({
    id: 'top-bar',
    template: template,
    _autocompleteSources: [],

    initSearchAutocomplete: function() {
        var queryEl = this.$el.find("#querySearchTerm");
        var resultsModal = $this.el.find("#searchResults");
        var resultsEl = resultsModal.find("ul");

        queryEl.typeahead({
            source:function (typeahead, query) {
                _.each(this._autocompleteSources, function(src) {
                    if (src.autocomplete) {
                        var resultBin = function(results) {
                            resultsModal.modal('show');
                            _.each(results, function(result) {
                                resultsEl.append("<li>" + result + "</li>");
                            });
                        };

                        resultsEl.find("a").click(function() {
                            resultsModal.modal('hide');
                            resultsEl.empty();
                        });

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
