var Template = require("./templates/linear_browser");
var LineItemTemplate = require("./templates/line_item");

module.exports = Backbone.View.extend({
    cancers: [],

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, "loadData", "initTypeahead", "initCancerSelector");

        $.ajax({ url:"svc/data/lookups/genes", type:"GET", dataType:"text", success:this.initTypeahead });

        $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.initCancerSelector });

        this.model.on("load", this.loadData)

        // example of use of handlebars.js
        this.$el.html(Template({ "title": "Loading..." }));
    },

    loadData: function() {
        console.log("loadData");
        var items = this.model.get("items");
        // TODO: read items , populate vis
        var viscontainer = this.$el.find(".vis-container");
        viscontainer.html("Reading data [" + items.length + "], drawing vis");
    },

    initCancerSelector: function(txt) {
        var cancers = txt.trim().split("\n");

        var selected_cancers = this.cancers;
        _.each(cancers, function(cancer) {
            cancer = cancer.trim();
            if (!_.isEmpty(selected_cancers) && selected_cancers.indexOf(cancer)) {
                $(".cancer-selector").append(LineItemTemplate({"li_class":"active","a_class":"toggle-active","id":cancer,"label":cancer}));
            } else {
                $(".cancer-selector").append(LineItemTemplate({"a_class":"toggle-active","id":cancer,"label":cancer}));
            }
        });

        var _this = this;
        $(".cancer-selector").find(".toggle-active").click(function(e) {
            $(e.target).parent().toggleClass("active");
        });
    },

    initTypeahead:function(txt) {
        var genelist = txt.trim().split("\n");

        var _this = this;
        this.$el.find(".genes-typeahead").typeahead({
            source:function (q, p) {
                p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function (qi) {
                    return _.map(genelist, function (geneitem) {
                        if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                    });
                }))));
            },
            updater: function(txt) {
                // TODO : Zoom in on current gene?
                // Maybe we do an Ajax lookup for the gene's location and use it to search for CNVR?
                var gene = txt.trim();
                var activeCancers = _.map(_this.$el.find(".cancer-selector li.active a"), function(lia) {
                    return $(lia).data("id");
                });

                console.log("selected-gene=" + gene);
                console.log("active-cancers=" + activeCancers);

                _this.model.fetch({
                    "data": {
                        "cancer": activeCancers,
//                        "start": startPos?,
//                        "end": endPos?,
//                        "strand": strand?,
                        "source": "CNVR"
                    },
                    "traditional": true,
                    success: function() {
                        _this.model.trigger("load");
                    }
                });
                
                return ""; // returns what you want to display in the typeahead text box
            }
        });
    }
});