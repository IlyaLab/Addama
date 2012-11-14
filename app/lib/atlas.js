var QEDRouter = require("./router");
var LineItemTemplate = require("../views/templates/line_item");

module.exports = Backbone.View.extend({
    initialize: function(element, options) {
        this.$el = $(element);
        if (options) _.extend(this, options);
        _.bindAll(this, "navigate", "loadCancerList", "initGeneTypeahead");

        $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.loadCancerList });
        $.ajax({ url:"svc/data/lookups/genes", type:"GET", dataType:"text", success:this.initGeneTypeahead });
    },

    navigate: function(target, route) {
        if (target && route) {
            route = route.replace("#v/", "");
            var uri = route.substring(0, route.lastIndexOf("/"));
            var view_name = route.substring(route.lastIndexOf("/") + 1);

            var afn = function(link) { return $(link).data("id")};
            var router = new QEDRouter({"targetEl": $(target)});
            router.viewsByUri(uri, view_name, {
                "cancers": _.map($(".cancer-selector .active a"), afn),
                "genes": _.map($(".gene-selector .item-remover"), afn)
            });
        }
    },

    loadCancerList: function(txt) {
        var cancerList = txt.trim().split("\n");
        var UL = $(".cancer-selector");
        _.each(cancerList, function(cancerItem) {
            UL.append(LineItemTemplate({"li_class":"active","a_class":"toggle-active","id":cancerItem,"label":cancerItem}));
        });

        UL.find(".toggle-active").click(function(e) {
            $(e.target).parent().toggleClass("active");
        });
    },

    initGeneTypeahead: function(txt) {
        var genelist = txt.trim().split("\n");

        var UL = $(".gene-selector");
        $(".genes-typeahead").typeahead({
            source:function (q, p) {
                p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function (qi) {
                    return _.map(genelist, function (geneitem) {
                        if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                    });
                }))));
            },

            updater:function (gene) {
                UL.append(LineItemTemplate({ "label":gene, "id":gene, "a_class":"item-remover", "i_class":"icon-trash" }));
                UL.find(".item-remover").click(function(e) {
                    $(e.target).parent().remove();
                });
                return gene;
            }
        });

        UL.find(".item-remover").click(function(e) {
            $(e.target).parent().remove();
        });
    }
});