var QEDRouter = require("./router");
var LineItemTemplate = require("../views/templates/line_item");

// TODO : Pass genes and cancers as view options
// TODO :
module.exports = Backbone.View.extend({
    initialize: function(element, options) {
        console.log("initialize");
        this.$el = $(element);
        if (options) _.extend(this, options);
        _.bindAll(this, "emphasize", "maximize", "minimize", "minimize_all", "navigate");
        _.bindAll(this, "loadCancerList", "initGeneTypeahead");

        $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.loadCancerList });
        $.ajax({ url:"svc/data/lookups/genes", type:"GET", dataType:"text", success:this.initGeneTypeahead });
    },

    emphasize: function(options) {
        var $step = options.$el;
        console.log("Atlas.emphasize:" + $step[0].id);

        this.minimize_all();
        this.navigate($step.find(".map-contents"), $step.data("medium"));
        _.defer(function() {
            $step.addClass("medium");
        });
    },

    maximize:function (options) {
        var $step = options.$el;
        console.log("Atlas.maximize:" + $step[0].id);

        this.minimize_all();
        this.navigate($step.find(".map-contents"), $step.data("big"));
        _.defer(function() {
            $step.addClass("big");
        });
    },

    minimize:function (options) {
        var $step = options.$el;
        console.log("Atlas.minimize:" + $step[0].id);

        $step.removeClass("medium");
        $step.removeClass("big");
        $step.addClass("small");

        this.navigate($step.find(".map-contents"), $step.data("small"));
    },

    minimize_all: function() {
        var _this = this;
        _.each(this.$el.find(".atlas-map"), function(atlasMap) {
            console.log("minimize_all=" + atlasMap);
            _this.minimize({"$el": $(atlasMap)});
        });
    },

    navigate: function(target, route) {
        if (route) {
            var route = route.replace("#v/", "");
            var uri = route.substring(0, route.lastIndexOf("/"));
            var view_name = route.substring(route.lastIndexOf("/") + 1);

            var router = new QEDRouter({"targetEl": $(target)});
            router.viewsByUri(uri, view_name);
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