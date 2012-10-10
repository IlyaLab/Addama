var View = require('./view');
var template = require("./templates/gene_list");
var GeneListItem = require("./templates/gene_list_item");

module.exports = View.extend({
    template:template,
    label:"Gene Lists",
    className: "row-fluid",
    genelists: {},

    events:{
        "click .gene-list-view .save-list":"saveGL",
        "click .gene-list-view .new-list":"newGL",
        "click .gene-list-view .genelist-edit":"editGL",
        "click .gene-list-view .genelist-view":"viewGL",
        "click .gene-lists li a":function(e) {
            e.preventDefault();
            this.trigger("genelist-selected", this.genelists[$(e.target).data("id")]);
        },
        "click .gene-list-view .item-remover": function(e) {
            $(e.target.parentNode).remove();
        }
    },

    initialize:function () {
        console.log("initialize:gene_list_view");
        _.bindAll(this, "initTypeahead", "initGenelists", "saveGL", "newGL", "viewGL", "editGL");

        $.ajax({ url: "svc/data/lookups/genes", type: "GET", dataType: "text", context: this, success: this.initTypeahead });
        $.ajax({ url: "svc/data/lookups/genelists", type: "GET", dataType: "json", context: "this", success: this.initGenelists(false) });
        $.ajax({ url: "svc/storage/genelists", type: "GET", dataType: "json", context: "this", success: this.initGenelists(true) });
    },

    afterRender: function() {
        console.log("gene_list_view.afterRender");
        this.$el.find(".sortable_list ul, li").disableSelection();
        this.$el.find(".gene-list-members").sortable({ revert:true });
        this.setEditsDisabled(true);
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
                _this.addGene(a);
                return a;
            }
        });
    },

    initGenelists: function(writable) {
        var _this = this;
        return function(json) {
            var genelistUL = _this.$el.find(".gene-lists");
            if (json) {
                if (json.files) {
                    _.each(json.files, function(gene_list) {
                        if (writable) {
                            genelistUL.append(GeneListItem(_.extend(gene_list, {"cls": 'icon-pencil genelist-edit'})));
                        } else {
                            genelistUL.append(GeneListItem(_.extend(gene_list, {"cls": 'icon-list genelist-view'})));
                        }
                        $.ajax({
                            url: "svc/data" + gene_list.uri,
                            type: "GET",
                            dataType: "text",
                            context: _this,
                            success: function(text) {
                                _this.genelists[gene_list.uri] = _.extend(gene_list, { values: text.trim().split("\n") });
                            }
                        });
                    });
                }
                if (json.items) {
                    _.each(json.items, function(item) {
                        var uri = item.uri;
                        $.ajax({
                            url: "svc" + uri,
                            type: "GET",
                            dataType: "json",
                            context: _this,
                            success: function(json) {
                                if (writable) {
                                    genelistUL.append(GeneListItem(_.extend(json, {"uri": uri, "cls": 'icon-pencil genelist-edit'})));
                                } else {
                                    genelistUL.append(GeneListItem(_.extend(json, {"uri": uri, "cls": 'icon-list genelist-view'})));
                                }

                                _this.genelists[uri] = json;
                            }
                        });
                    })
                }
            }
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
        var gene_list = _.compact(_.map(this.$el.find(".gene-list-members li span"), function(item) { return $(item).data("id") }));
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
                this.$el.find(".gene-lists").append(GeneListItem(_.extend(json, {"label":gene_list_label, "cls": 'icon-pencil genelist-edit'})));
            }
        });
    },

    viewGL: function(e) {
        e.preventDefault();
        console.log("gene_list_view.viewGL");

        var gene_list_id = $(e.target).data("id");

        var gene_list = this.genelists[gene_list_id];

        this.$el.find(".gene-lists li span").css("font-weight", "normal");
        $(e.target).css("font-weight", "bolder");

        var gene_ids = [];

        var geneListEl = this.$el.find(".gene-list-members");
        geneListEl.empty();
        this.$el.find(".genelist-label").val(gene_list.label);
        _.each(gene_list.values, function(gene) {
            geneListEl.append("<li><span class='gene-item' data-id='" + gene + "'>" + gene + "</span></li>");
        });

        this.setEditsDisabled(true);
    },

    editGL: function(e) {
        e.preventDefault();

        var gene_list_id = $(e.target).data("id");

        var gene_list = this.genelists[gene_list_id];

        this.$el.find(".gene-lists li span").css("font-weight", "normal");
        $(e.target).css("font-weight", "bolder");

        var gene_ids = [];

        var geneListEl = this.$el.find(".gene-list-members");
        geneListEl.empty();

        this.$el.find(".genelist-label").val(gene_list.label);
        _.each(gene_list.values, function(gene) {
            geneListEl.append("<li><span class='gene-item' data-id='" + gene + "'>" + gene + "</span>&nbsp;<i class='icon-trash item-remover' data-gene='" + gene + "'></i></li>");
        });

        this.setEditsDisabled(false);
    },

    addGene: function(gene) {
        this.$el.find(".gene-list-members").append("<li><span class='gene-item' data-id='" + gene + "'>" + gene + "</span>&nbsp;<i class='icon-trash item-remover' data-gene='" + gene + "'></i></li>");
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