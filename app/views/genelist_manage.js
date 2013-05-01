var View = require('./view');
var template = require("./templates/genelist_manage");
var LineItem = require("./templates/line_item");
var GeneRemoveLink = require("./templates/line_item");

module.exports = View.extend({
    template:template,

    events:{
        "click .save-list":"saveGL",
        "click .load-list":"loadGL",
        "click .new-list":"newGL",
        "click .item-remover":function (e) {
            $(e.target).parent().remove();
        }
    },

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "initTypeahead", "newGL", "saveGL", "loadGL", "appendGenelists");
        $.ajax({ url:"svc/data/lookups/genes", type:"GET", dataType:"text", context:this, success:this.initTypeahead });

        this.model.on('load', this.appendGenelists);
    },

    appendGenelists:function () {
        var genelistUL = this.$el.find("ul.genelists");
        genelistUL.empty();
        _.each(this.model.get("items"), function (item) {
            genelistUL.append(LineItem(_.extend(item, {"a_class":'load-list'})));
        });
    },

    afterRender:function () {
        this.$el.find(".sortable_list ul, li").disableSelection();
        this.$el.find(".genelist-members").sortable({ revert:true });
    },

    initTypeahead:function (txt) {
        this.genelist = txt.trim().split("\n");

        var _this = this;
        this.$el.find(".genes-typeahead").typeahead({
            source:function (q, p) {
                p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function (qi) {
                    return _.map(_this.genelist, function (geneitem) {
                        if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                    });
                }))));
            },

            updater:function (gene) {
                _this.$el.find(".genelist-members").append(GeneRemoveLink({ "label":gene, "id":gene, "a_class":"item-remover", "i_class":"icon-trash" }));
                return gene;
            }
        });
    },

    newGL:function (e) {
        this.$el.find(".genelist-members").empty();
        this.$el.find(".genelist-label").data("id", "newlist");
        this.$el.find(".genelist-label").val("Untitled");
    },

    loadGL:function (e) {
        var genelist_id = $(e.target).data("id");
        var genelist = _.find(this.model.get("items"), function (item) {
            return item.id == genelist_id;
        });
        if (genelist) {
            var UL = this.$el.find("ul.genelist-members");
            UL.empty();
            this.$el.find(".genelist-label").val(genelist.label);
            this.$el.find(".genelist-label").data("id", genelist.id);
            _.each(genelist.values, function (gene) {
                UL.append(GeneRemoveLink({ "label":gene, "id":gene, "a_class":"item-remover", "i_class":"icon-trash" }));
            });
        }
    },

    saveGL:function (e) {
        var label = this.$el.find(".genelist-label");
        var genelist = _.uniq(_.compact(_.map(this.$el.find(".genelist-members li a"), function (item) {
            return $(item).data("id");
        })));

        var genelist = { label:label.val(), values:genelist };

        if (label.data("id") != "newlist") {
            genelist["id"] = label.data("id");
        }
        this.model.save(genelist);
    }

});