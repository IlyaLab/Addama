var LineItemTemplate = require("../views/templates/line_item");

module.exports = Backbone.View.extend({
    initialize: function(element, options) {
        this.$el = $(element);
        if (options) _.extend(this, options);
        _.bindAll(this, "navigate", "loadCancerList", "initGeneTypeahead");

        $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.loadCancerList });
        $.ajax({ url:"svc/data/lookups/genes", type:"GET", dataType:"text", success:this.initGeneTypeahead });
    },

    navigate: function(target, view_options, query_options) {
        var source = target.data("source");
        var view_name = target.data("view");
        var linked_to = target.data("linked");
        if (source && view_name) {
            var afn = function(link) {
                return $(link).data("id")
            };

            var cancerList = _.map($(".cancer-selector .active a"), function(link) {
                return $(link).data("id");
            });
            var geneList = _.map($(".gene-selector .item-remover"), function(link) {
                return $(link).data("id");
            });

            // TODO : Standardize how we store and lookup cancers
            var qCancerList = cancerList;
            if (target.data("lowercase") && target.data("lowercase") == true) {
                qCancerList = _.map(cancerList, function(cancerItem) {
                    return cancerItem.toLowerCase();
                });
            }
            var v_options = _.extend({ "genes": geneList, "cancers": cancerList, "hideSelector": true }, view_options);
            var q_options = _.extend({ "gene": geneList, "cancer": qCancerList }, query_options);

            var view = this.viewsByUri($(target), source, view_name, v_options, q_options);
            if (linked_to) {
                var _this = this;
                view.on("selected", function(selected) {
                    var gene = [selected.gene.toUpperCase()];
                    var cancer = [selected.cancer.toUpperCase()];
                    var qoptns = { "cancer": cancer, "gene": gene };
                    var voptns = { "cancers": cancer, "genes": gene };
                    _this.navigate($(linked_to).find(".map-contents"), voptns, qoptns);
                });
            }
        }
    },

    viewsByUri: function($el, uri, view_name, options, query) {
        console.log("viewsByUri(" + uri + "," + view_name + "," + JSON.stringify(options) + "," + JSON.stringify(query) + ")");
        var parts = uri.split("/");
        var data_root = parts[0];
        var analysis_id = parts[1];
        var dataset_id = parts[2];
        var model_unit = qed.Datamodel.get(data_root)[analysis_id];
        var catalog = model_unit.catalog;
        var catalog_unit = catalog[dataset_id];
        var modelName = model_unit.model || catalog_unit.model;
        var serviceUri = catalog_unit.service || model_unit.service || "data/" + uri;
        var Model = qed.Models[modelName || "Default"];

        var model_optns = _.extend(options, {
            "data_uri": "svc/" + serviceUri,
            "analysis_id": analysis_id,
            "dataset_id": dataset_id,
            "model_unit": model_unit,
            "catalog_unit": catalog_unit
        });
        // TODO: Determine which views need annotations
        // qed.FetchAnnotations(dataset_id);

        var model = new Model(model_optns);
        _.defer(function() {
            model.fetch({
                "data": query,
                "traditional": true,
                success:function () {
                    model.trigger('load');
                }
            });
        });

        var view_options = _.extend({"model":model}, (model_unit.view_options || {}), (options || {}));

        var ViewClass = qed.Views[view_name];
        var view = new ViewClass(view_options);
        $el.html(view.render().el);
        return view;
    },

    loadCancerList: function(txt) {
        var cancerList = txt.trim().split("\n");
        var UL = $(".cancer-selector");
        _.each(cancerList, function(cancerItem, idx) {
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
                return "";
            }
        });

        UL.find(".item-remover").click(function(e) {
            $(e.target).parent().remove();
        });
    },

    zoom: function(level) {
        // TODO : Figure out way to center screen on where the mouse has clicked
        $(".atlas-zoom").zoomTo({
            "duration":1000,
            "scalemode": "both",
            "easing": "ease",
            "nativeanimation": true,
            "root": $(".atlas-canvas"),
            "closeclick": false,
            "targetsize":level
        });
    }
});