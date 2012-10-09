var View = require('./view');
var template = require("./templates/gene_list");

module.exports = View.extend({
    template:template,
    label:"Gene Lists",
    className: "row-fluid",
    genelists: {},

    events:{
        "click .save-gene-list":"saveGeneList",
        "click .new-gene-list":"newGeneList",
        "click .gene-lists li .genelist-edit":"editGeneList",
        "click .gene-lists li a":function(e) {
            e.preventDefault();
            this.trigger("genelist-selected", this.genelists[$(e.target).data("id")]);
        }
    },

    initialize:function () {
        console.log("initialize:gene_list_view");
        _.bindAll(this, "initTypeahead", "initGenelists", "saveGeneList", "newGeneList", "editGeneList");

        $.ajax({
            url: "svc/data/lookups/genes",
            type: "GET",
            dataType: "text",
            context: this,
            success: this.initTypeahead
        });

        $.ajax({
            url: "svc/data/lookups/genelists",
            type: "GET",
            dataType: "json",
            context: "this",
            success: this.initGenelists
        });
    },

    afterRender: function() {
        console.log("gene_list_view.afterRender");
        this.$el.find(".sortable_list ul, li").disableSelection();
        this.$el.find(".gene-list-members").sortable({ revert:true });
        this.$el.find(".edit-gene-list").css("font-size", "smaller");
    },

    initTypeahead: function(txt) {
        console.log("gene_list_view.initTypeahead:" + txt);

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

            updater: function(a) {
                _this.trigger("genes-selected", a);
                return "";
            }
        });
    },

    initGenelists: function(json) {
        var _genelists = this.genelists;
        var genelistUL = this.$el.find(".gene-lists");
        if (json && json.files) {
            _.each(json.files, function(gene_list) {
                $.ajax({
                    url: "svc/data" + gene_list.uri,
                    type: "GET",
                    dataType: "text",
                    context: this,
                    success: function(text) {
                        genelistUL.append("<li><a href='#' data-id='" + gene_list.uri + "'>" + gene_list.label + "</a> <i class='icon-pencil genelist-edit'></i></li>");
                        _genelists[gene_list.uri] = _.extend(gene_list, { values: text.trim().split("\n") });
                    }
                });
            });
        }
    },

    newGeneList: function(e) {
        e.preventDefault();
        console.log("gene_list_view.newGeneList");

//        this.$el.find(".gene-lists li a").css("font-weight", "normal");
//        this.$el.find(".gene-lists").append("<li><a href='#' style='font-weight: bolder;' data-id='localStorage:genelists.untitled'>Untitled</a></li>");
    },

    saveGeneList: function(e) {
        e.preventDefault();
        console.log("gene_list_view.saveGeneList");
        var link = $(e.target);
    },

    editGeneList: function(e) {
        var gene_list_id = $(e.target).data("id");
        console.log("editGeneList:" + $(e.target).data("id"));

        e.preventDefault();
//        this.$el.find(".gene-lists li a").css("font-weight", "normal");
        $(e.target).css("font-weight", "bolder");

        var posLocStorageUri = gene_list_id.indexOf("localStorage:");
        var gene_ids = [];

        var geneListEl = this.$el.find(".gene-list-members");
        var loadGenesFromListFn = function(gene_array) {
            geneListEl.empty();
            _.each(gene_array, function(gene) {
                geneListEl.append("<li><span class='gene-item' data-id='" + gene + "'>" + gene + "</span>&nbsp;<span class='item-remover' data-list='" + gene_list_id + "' data-gene='" + gene + "'>x</span></li>");
            });
        };
        if (posLocStorageUri >= 0) {
            var foundGenes = localStorage.getItem(posLocStorageUri.substring(posLocStorageUri));
            if (foundGenes && foundGenes.length) {
                loadGenesFromListFn(foundGenes.split("\t"));
            }
        } else {
//            $.ajax({
//                url: "svc/data" + gene_list_id,
//                type: "GET",
//                dataType: "text",
//                context: this,
//                success: function(txt) {
//                    loadGenesFromListFn(txt.trim().split("\n"));
//                }
//            });
            loadGenesFromListFn(this.genelists[gene_list_id].values);
        }

//        this.on("genes-selected", function(selection) {
//            var gene = selection.gene;
//            var list = selection.list;
//            genesToBeAdded.append("<li><a href='#' class='gene-item' data-id='" + gene + "'>" + gene + "</a><a href='#' class='remove-gene' data-list='" + list + "' data-gene='" + gene + "'>x</a></li>");
//        });

//        genesToBeAdded.find(".remove-gene").click(function(e) {
//            e.preventDefault();
//
//            var link = $(e.target);
//            _this.trigger("gene-removed", { list: link.data("list"), gene: link.data("gene") });
//            link.remove();
//        });
//        genesToBeAdded.find(".gene-item").click(function(e) {
//            e.preventDefault();
//        });
    }
});