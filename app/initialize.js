$(function () {
    qed = {
        models: {
            "JSON": require("models/model_json"),
            "Catalogs": require("models/catalog"),
            "Annotations": require("models/model_catalog"),
            "Mappings": require("models/model_catalog"),
            "FeatureMatrix": require("models/featureMatrix2"),
//            "Adjacencies": require("models/adjacencies"),
            "GraphLayouts": require("models/graph_layouts")
        },
        ViewMappings: {
            "JSON": [],
            "Catalogs": [],
            "Annotations": [
                { "id": "grid", label: "Grid" }
            ],
            "Mappings": [],
            "FeatureMatrix": [
                { "id": "grid", label: "Grid" },
                { "id": "heat", label: "Heatmap" }
            ],
//            "Adjacencies": [],
            "GraphLayouts": [
                { "id": "graph", label: "Graph" }
            ]
        },
        Lookups: {
            Labels: {}
        },
        Display: {},
        Datamodel: {}
    };

    qed.Display = new qed.models.JSON({ url:"svc/data/qed_display.json" });
    qed.Display.on("load", function() {
        document.title = (qed.Display.get("title") || "QED");
    });
    qed.Display.standard_fetch();

    qed.Datamodel = new qed.models.JSON({ url:"svc/data/qed_datamodel.json" });
    qed.Datamodel.on("load", function() {
        var section_ids = _.without(_.keys(qed.Datamodel.attributes), "url");
        var catalog_counts = _.map(section_ids, function(section_id) {
            var section = qed.Datamodel.get(section_id);
            return _.without(_.keys(section), "label").length;
        });

        var allCatalogs = _.reduce(_.flatten(catalog_counts), function(sum, next) {
            return sum + next;
        });

        var initLayoutFn = _.after(allCatalogs, function() {
            var QEDRouter = require('lib/router');
            qed.Router = new QEDRouter();
            qed.Router.initTopNavBar();
            Backbone.history.start();
        });
        _.each(section_ids, function(section_id) {
            _.each(qed.Datamodel.get(section_id), function(unit, unit_id) {
                if (unit_id != "label") {
                    if (!unit.catalog) unit.catalog = {};

                    var catalog = new qed.models.Catalogs({"url":"svc/data/" + section_id + "/" + unit_id});
                    catalog.on("load", function() {
                        _.each(catalog.get("itemsById"), function(item, item_id) {
                            if (!unit.catalog[item_id]) unit.catalog[item_id] = {};
                            _.extend(unit.catalog[item_id], (unit["catalog_defaults"] || {}), item);
                        });

                        initLayoutFn();
                    });
                    catalog.on("error", initLayoutFn);
                    catalog.standard_fetch();
                }
            });
        });
    });

    qed.Datamodel.standard_fetch();
    qed.Lookups.Chromosomes = new qed.models.Annotations({ url:"svc/data/lookups/chromosomes" }).standard_fetch();
});
