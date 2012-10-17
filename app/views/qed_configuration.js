var View = require('./view');
var JsonModel = require('../models/model_json');
var TableModel = require("../models/model_catalog");

module.exports = View.extend({
    model: JsonModel,
    featureLabels: TableModel,

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, 'loadConfiguration');

        this.multiLoad([this.model, this.featureLabels], this.loadConfiguration);
    },

    loadConfiguration:function () {
        console.log("loadConfiguration");

        var title = this.model.get("title");
        if (title) {
            document.title = title;
            $(".titled").html(title);
        }

        qed.labels = this.featureLabels.get("itemsById");
    }
});
