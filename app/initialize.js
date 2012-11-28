$(function () {
    qed = {
        Events: _.extend(Backbone.Events),
        Models:{
            "Catalogs":require("models/catalog"),
            "Annotations":require("models/annotations"),
            "Mappings":require("models/mappings"),
            "FeatureMatrix":require("models/featureMatrix2"),
            "FeatureMatrixFromTsv":require("models/featureMatrixFromTsv"),
            "FeatureMatrixAsTable":require("models/featureMatrix2asTable"),
            "FeatureMatrix3":require("models/featureMatrix3"),
            "GraphLayouts":require("models/graph_layouts"),
            "Mutations":require("models/mutations_interpro"),
            "PubcrawlNetwork":require("models/pubcrawlNetwork"),
            "PubcrawlLit": require("models/pubcrawlLit"),
            "Default":Backbone.Model.extend({
                url: function() {
                    return this.get("data_uri");
                }
            })
        },
        ViewMappings:{
            "Annotations":[
                { "id":"grid", label:"Grid" }
            ],
            "FeatureMatrix":[
                { "id":"grid", label:"Grid" },
                { "id":"stacksvis", label:"Stacks" },
                { "id":"xfeaturegrid", label:"Cross-Feature Summary" }
            ],
            "FeatureMatrixAsTable":[
                { "id":"grid", label:"Grid" },
                { "id":"stacksvis", label:"Stacks" }
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
            "stacksvis":require("views/stacksvis_container"),
            "stacksvis2":require("views/stacksvis_simpler"),
            "graph":require("views/graphtree_view"),
            "pwpv":require("views/pwpv_view"),
            "twoD":require("views/2D_Distribution_view"),
            "kde":null,
            "parcoords":require("views/parcoords_view"),
            "seqpeek":require("views/seqpeek_view"),
            "xfeaturegrid": require("views/xfeaturegrid"),
            "xfeaturegrid_small": require("views/xfeaturegrid_small"),
            "mutsig_grid": require("views/mutsig_grid_view"),
            "mutsig_top_genes": require("views/mutsig_top_genes_view"),
            "scatterplot": require("views/scatterplot_view"),
            "linear_browser": require("views/linear_browser"),
            "datatable": require("views/datatable_view"),
            "pubcrawl_network": require("views/pubcrawl_network"),
            "pubcrawl_lit": require("views/pubcrawl_lit"),
            "items_grid": require("views/items_grid_view"),
            "Atlas": require("views/atlas")
        },
        Lookups:{
            Labels:{}
        },
        Display:new Backbone.Model(),
        Datamodel:new Backbone.Model(),
        Sessions: {
            All: null,
            Active: null,
            Producers: {}
        }
    };

    qed.Display.fetch({
        url:"svc/data/qed_display.json",
        success:function () {
            document.title = (qed.Display.get("title") || "QED");
        }
    });

    var startupUI = function() {
        $.ajax({
            "url": "svc/storage/sessions",
            "method": "GET",
            "success": function(json) {
                var SessionsCollection = require("models/sessions");
                qed.Sessions.All = new SessionsCollection(json.items);

                var QEDRouter = require('lib/router');
                qed.Router = new QEDRouter();
                qed.Router.initTopNavBar();

                Backbone.history.start();
                qed.Events.trigger("ready");
            }
        });
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
