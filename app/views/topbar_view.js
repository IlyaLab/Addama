var View = require('./view');
var template = require('./templates/topbar');

module.exports = View.extend({
    id: 'top-bar',
    template: template,
    _autocompleteSources: [],

    initSearchAutocomplete: function() {
        var queryEl = this.$el.find("#querySearchTerm");
        var resultsModal = this.$el.find("#searchResults");
        resultsModal.modal({
            backdrop: false, show: false
        });

        var resultsEl = resultsModal.find("ul");
        var me = this;

        queryEl.typeahead({
            source:function (query) {
                resultsEl.empty();

                _.each(me._autocompleteSources, function(src) {
                    if (src.autocomplete) {
                        var resultBin = function(results) {
                            if (results && results.length) {
                                resultsModal.modal('show');
                                _.each(_.uniq(results), function(result) {
                                    resultsEl.append("<li>" + result + "</li>");
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
