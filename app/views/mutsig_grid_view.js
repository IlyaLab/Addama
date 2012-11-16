var View = require('./view');
var template = require('./templates/mutsig_grid');

module.exports = View.extend({
    template:template,
    label: "MutSig",
    className:"row-fluid",

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, "afterRender", "getRenderData", "loadData", "parseMutSigRankings", "updateGrid");

        // Get genes from the Atlas view dropdown
        this.genes = $('.gene-items .gene-selector li a').map(function() {
            return {
                id: $(this).attr("data-id")
            };
        });

        if (this.genes.length === 0) {
            this.genes = [{id:'TP53'}, {id:'CTCF'}];
        }

        // Get cancer types from Atlas view
        this.cancers = $('.cancer-items ul li.active a i').map(function() {
            return {
                id: $(this).attr("data-id")
            };
        });

        if (this.cancers.length === 0) {
            this.cancers = [{id: 'BRCA'}, {id: 'GBM'}, {id: 'UCEC'}];
        }

        this.mutsig = {};

        var callbackFn = _.bind(function() {
            this.updateGrid();
        }, this);

        this.loadData(callbackFn);
    },

    afterRender: function () {
        this.updateGrid();
    },

    getRenderData: function() {
        var that = this;

        return {
            "cancers": this.cancers,
            "genes": _.map(this.genes, function(gene) {
                return {
                    id: gene.id,
                    rank_by_cancer: that.mutsig[gene.id]
                };
            })
        };
    },

    loadData: function(callbackFn) {
        var mutsig_data = {};

        var successFn = _.after(this.genes.length, _.bind(function() {
            this.parseMutSigRankings(mutsig_data);
            callbackFn();
        }, this));

        _.each(this.genes, function(gene) {
            var uri = "/svc/lookups/qed_lookups/mutsig_rankings/?gene=" + gene.id.toUpperCase();

            $.ajax({
                url: uri,
                type: "GET",
                dataType: "text",
                context: this,
                success: function(response) {
                    mutsig_data[gene.id] = $.parseJSON(response);
                    successFn();
                }
            });
        });
    },

    parseMutSigRankings: function(mutsig_data) {
        var that = this;
        _.each(mutsig_data, function(obj, gene) {
            that.mutsig[gene] = [];

            var ranking_by_cancer = _.chain(obj.items)
                .groupBy('cancer')
                .value();
            
            _.chain(that.cancers)
                .pluck('id')
                .each(function(cancer) {
                    that.mutsig[gene].push(ranking_by_cancer[cancer][0]);
            });
        });
    },

    updateGrid: function() {
        this.$el.html(this.template(this.getRenderData()));
    }
});
