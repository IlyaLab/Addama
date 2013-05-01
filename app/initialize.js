$(function () {
    qed = {
        Models:{
            "Catalogs":require("models/catalog"),
            "Annotations":require("models/annotations"),
            "Mappings":require("models/mappings"),
            "FeatureMatrix":require("models/featureMatrix2"),
            "GraphLayouts":require("models/graph_layouts"),
            "Mutations":require("models/mutations")
        },
        ViewMappings:{
            "Annotations":[
                { "id":"grid", label:"Grid" }
            ],
            "FeatureMatrix":[
                { "id":"grid", label:"Grid" },
                { "id":"heat", label:"Heatmap" },
                { "id":"xfeaturegrid", label:"Cross-Feature Summary" }
            ],
            "GraphLayouts":[
                { "id":"circ", label:"CircVis" },
                { "id":"grid", label:"Grid" },
                { "id":"graph", label:"Graph" }
            ],
            "Mutations": [
                { "id":"seqpeek", label:"Mutation Viewer" }
            ]
        },
        Views:{
            "grid":require("views/grid_view"),
            "circ":require("views/circvis_view"),
            "heat":require("views/oncovis_view"),
            "graph":require("views/graphtree_view"),
            "pwpv":require("views/pwpv_view"),
            "twoD":require("views/2D_Distribution_view"),
            "kde":null,
            "parcoords":require("views/parcoords_view"),
            "seqpeek":require("views/seqpeek_view"),
            "xfeaturegrid": require("views/xfeaturegrid")
        },
        Lookups:{
            Labels:{}
        },
        Display:new Backbone.Model(),
        Datamodel:new Backbone.Model()
    };

    qed.Display.fetch({
        url:"svc/data/qed_display.json",
        success:function () {
            document.title = (qed.Display.get("title") || "QED");
        }
    });

    var startupUI = function() {
        var QEDRouter = require('lib/router');
        qed.Router = new QEDRouter();
        qed.Router.initTopNavBar();
        Backbone.history.start();
    };

    qed.Datamodel.fetch({
        url:"svc/data/qed_datamodel.json",
        success:function () {
            var section_ids = _.without(_.keys(qed.Datamodel.attributes), "url");
            var catalog_counts = _.map(section_ids, function (section_id) {
                var section = qed.Datamodel.get(section_id);
                return _.without(_.keys(section), "label").length;
            });

            var allCatalogs = _.reduce(_.flatten(catalog_counts), function (sum, next) {
                return sum + next;
            });

            var initLayoutFn = _.after(allCatalogs, startupUI);
            _.each(section_ids, function (section_id) {
                _.each(qed.Datamodel.get(section_id), function (unit, unit_id) {
                    if (unit_id != "label") {
                        var catalog = new qed.Models.Catalogs({"url":"svc/data/" + section_id + "/" + unit_id + "/CATALOG", "unit":unit});
                        catalog.fetch({ success:initLayoutFn, error:initLayoutFn });
                    }
                });
            });
        },
        error: startupUI
    });

    qed.Lookups.Chromosomes = new qed.Models.Annotations({ url:"svc/data/lookups/chromosomes" });
    qed.Lookups.Chromosomes.fetch({"dataType":"text"});

    qed.Annotations = {};
    qed.FetchAnnotations = function (dataset_id) {
        if (_.isEmpty(qed.Annotations[dataset_id])) {
            var annotations = new qed.Models.Annotations({"url":"svc/data/annotations/" + dataset_id + ".json", "dataType":"json"});
            annotations.fetch({
                "async":false,
                "dataType":"json",
                "success":function () {
                    qed.Annotations[dataset_id] = annotations.get("itemsById");
                }
            });
        }
        return qed.Annotations[dataset_id];
    };
});
