var application = require('application');

$(function () {
    qed = {
        app:application,
        models: {
            "JSON": require("models/model_json"),
            "Catalogs": require("models/catalog"),
            "Annotations": require("models/model_catalog"),
            "Mappings": require("models/model_catalog"),
            "FeatureMatrix": require("models/featureMatrix2"),
            "Adjacencies": require("models/featureMatrix2")
        },
        Lookups: {},
        Display: {},
        Datamodel: {}
    };

    application.initialize();
    Backbone.history.start();

    qed.Display = new qed.models.JSON({ url:"svc/data/qed_display.json" });
    qed.Display.on("load", function() {
        var title = (qed.Display.get("title") || "QED");
        document.title = title;
        $(".titled").html(title);
    });
    qed.Display.standard_fetch();

    qed.Datamodel = new qed.models.JSON({ url:"svc/data/qed_datamodel.json" });
    qed.Datamodel.on("load", function() {
        var keys = _.without(_.keys(qed.Datamodel.attributes), "url");
        var numItemsFn = function(key) { return _.keys(qed.Datamodel.get(key)).length; };
        var sumFn = function(sum, next) { return sum + next; };
        var expectedCatalogs = _.reduce(_.flatten(_.map(keys, numItemsFn )), sumFn);
        var initLayoutFn = _.after(expectedCatalogs, application.initLayout);

        _.each(keys, function(key) {
            _.each(qed.Datamodel.get(key), _loadCatalogs(key, initLayoutFn));
        });
    });

    qed.Datamodel.standard_fetch();
    qed.Lookups.Chromosomes = new qed.models.Annotations({ url:"svc/data/lookups/chromosomes" }).standard_fetch();
});

var _loadCatalogs = function(data_id, callback) {
    return function(domain, domain_name) {
        if (domain && domain_name != "label") {
            if (!domain.catalog) domain.catalog = {};

            var catalog = new qed.models.Catalogs({"url":"svc/data/" + data_id + "/" + domain_name});
            catalog.on("load", function() {
                _.each(catalog.get("itemsById"), function(item, item_id) {
                    if (!domain.catalog[item_id]) domain.catalog[item_id] = {};
                    _.extend(domain.catalog[item_id], item);
                });

                callback();
            });
            catalog.on("error", callback);
            catalog.standard_fetch();
        }
    };
};