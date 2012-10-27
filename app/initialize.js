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
        var model_keys = _.without(_.keys(qed.Datamodel.attributes), "url");

        var map = _.map(model_keys, function(model_key) {
            return _.keys(qed.Datamodel.get(model_key)).length;
        });
        var numberOfCatalogs = _.reduce(_.flatten(map), function(memo, num){ return memo + num; });

        var initLayoutFn = _.after(numberOfCatalogs, application.initLayout);

        _.each(model_keys, function(model_key) {
            _.each(qed.Datamodel.get(model_key), _loadCatalogs(model_key, initLayoutFn));
        });
    });

    qed.Datamodel.standard_fetch();
    qed.Lookups.Chromosomes = new qed.models.Annotations({ url:"svc/data/lookups/chromosomes" }).standard_fetch();
});

var _loadCatalogs = function(data_id, callback) {
    return function(domain, domain_name) {
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
    };
};