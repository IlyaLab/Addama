var View = require('./view');
var template = require("./templates/gene_list");
var GeneListItem = require("./templates/gene_list_item");
var GeneListItemRemover = require("./templates/gene_list_item_remover");

module.exports = View.extend({
    template:template,
    label:"Gene Lists",
    className: "row-fluid",
    genelists: {},

    events:{
        "click .gene-list-view .save-list":"saveGL",
        "click .gene-list-view .new-list":"newGL",
        "click .gene-list-view .edit-list":"editGL",
        "click .gene-list-view .view-list":"viewGL",
        "click .gene-list-view .select-list": function(e) {
            this.trigger("genelist-selected", $(e.target).data("id"));
        },
        "click .gene-list-view .item-remover": function(e) {
            $(e.target).parent().remove();
        }
    },

    initialize:function () {
        console.log("initialize:gene_list_view");
        _.bindAll(this, "initTypeahead", "saveGL", "newGL", "viewGL", "editGL");

        $.ajax({ url: "svc/data/lookups/genes", type: "GET", dataType: "text", context: this, success: this.initTypeahead });
    },

    afterRender: function() {
        console.log("gene_list_view.afterRender");

        var _this = this;
        var genelistUL = this.$el.find(".gene-lists");
        var fn = function(items) {
            _.each(items, function(item) {
                genelistUL.append(GeneListItem(_.extend(item, {"aCls": 'view-list'})));
            });
            _this.trigger("load-genelists", items);
        };
        $.ajax({ url: "svc/data/lookups/genelists/CATALOG", type: "GET", dataType: "text", success: this.initCatalog(this.genelists, fn) });

        this.$el.find(".sortable_list ul, li").disableSelection();
        this.$el.find(".gene-list-members").sortable({ revert:true });
        this.setEditsDisabled(true);
    },

    initTypeahead: function(txt) {
        this.genelist = txt.trim().split("\n");

        var _this = this;
        this.$el.find(".genes-typeahead").typeahead({
            source: function(q, p) {
                p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function(qi) {
                    return _.map(_this.genelist, function(geneitem) {
                        if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                    });
                }))));
            },

            updater: function(gene) {
                _this.$el.find(".gene-list-members").append(GeneListItemRemover({"gene":gene}));
                return gene;
            }
        });
    },

    initCatalog: function(genelists, callback) {
        return function(txt) {
            var rows = d3.tsv.parseRows(txt);
            var idxs = _.map(_.first(rows), function(cell) { return cell.toLowerCase(); });
            var items = _.map(_.rest(rows, 1), function(cells) {
                var item = {};
                _.each(cells, function(cell, cellIdx) {
                    var key = idxs[cellIdx];
                    item[key] = cell;
                });
                item["uri"] = "/lookups/genelists/" + item["id"];
                return item;
            });

            _.each(items, function(item) {
                $.ajax({ url: "svc/data" + item.uri, type: "GET", dataType: "text", success: function(txt) {
                        genelists[item.uri] = _.extend(item, { values: txt.trim().split("\n") });
                    }
                });
            });

            if (callback) callback(items);
        }
    },

    newGL: function(e) {
        e.preventDefault();
        console.log("gene_list_view.newGL");
        this.$el.find(".gene-list-members").empty();
        this.$el.find(".genelist-label").val("Untitled");
        this.setEditsDisabled(false);
    },

    saveGL: function(e) {
        console.log("gene_list_view.saveGL");
        e.preventDefault();

        var gene_list_label = this.$el.find(".genelist-label").val();
        var gene_list = _.uniq(_.compact(_.map(this.$el.find(".gene-list-members li span"), function(item) { return $(item).data("id") })));
        $.ajax({
            url: "svc/storage/genelists",
            type: "POST",
            dataType: "json",
            data: {
                label: gene_list_label, values: gene_list
            },
            context: this,
            success: function(json) {
                this.genelists[json.uri] = gene_list;
                this.$el.find(".gene-lists").append(GeneListItem(_.extend(json, {"label":gene_list_label, "aCls": 'edit-list'})));
            }
        });
    },

    viewGL: function(e) {
        e.preventDefault();
        console.log("gene_list_view.viewGL");

        var gene_list_id = $(e.target).data("id");
        var gene_list = this.genelists[gene_list_id];
        var gene_ids = [];

        var geneListEl = this.$el.find(".gene-list-members");
        geneListEl.empty();
        this.$el.find(".genelist-label").val(gene_list.label);
        _.each(gene_list.values, function(gene) {
            geneListEl.append("<li>" + gene + "</li>");
        });

        this.setEditsDisabled(true);

        this.$el.find(".select-list").data("id", gene_list_id);
    },

    editGL: function(e) {
        e.preventDefault();

        var gene_list_id = $(e.target).data("id");

        var gene_list = this.genelists[gene_list_id];

        var gene_ids = [];

        var geneListEl = this.$el.find(".gene-list-members");
        geneListEl.empty();

        this.$el.find(".genelist-label").val(gene_list.label);
        _.each(gene_list.values, function(gene) {
            geneListEl.append(GeneListItemRemover({"gene":gene}));
        });

        this.setEditsDisabled(false);
    },

    setEditsDisabled: function(disableFlag) {
        this.$el.find(".gene-list-view .editors").prop("disabled", disableFlag);
        if (disableFlag) {
            this.$el.find(".gene-list-view .editors").css("color", "grey");
        } else {
            this.$el.find(".gene-list-view .editors").css("color", "black");
        }
    }
});