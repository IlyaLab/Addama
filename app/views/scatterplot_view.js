var View = require('./view');
var template = require('./templates/scatterplot');
var LineItemTemplate = require("./templates/line_item");

module.exports = View.extend({
    template: template,
    className: "row-fluid",
    current_cancer: "BRCA",
    selected_genes: { "x":"TP53", "y": "CTCF" },
    selected_features: { "x":null, "y": null },

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, "initCancerSelector", "initGeneTypeaheads", "drawGraph", "selectedFeatureData");
        _.bindAll(this, "loadData", "reloadModel", "initFeatureLabelSelector");

        $.ajax({ url:"svc/data/lookups/genes", type:"GET", dataType:"text", success:this.initGeneTypeaheads });
        $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.initCancerSelector });

        this.model.on("load", this.loadData);
    },

    initCancerSelector: function(txt) {
        var cancers = txt.trim().split("\n");

        var selected_cancers = this.cancers;
        if (!_.isEmpty(selected_cancers)) {
            cancers = _.filter(cancers, function(cancer) {
                return selected_cancers.indexOf(cancer);
            });
        }
        _.each(cancers, function(cancer, idx) {
            cancer = cancer.trim();
            if (idx == 0) {
                $(".cancer-selector").append(LineItemTemplate({"li_class":"active","a_class":"toggle-active","id":cancer,"label":cancer}));
            } else {
                $(".cancer-selector").append(LineItemTemplate({"a_class":"toggle-active","id":cancer,"label":cancer}));
            }
        });

        var _this = this;
        $(".cancer-selector").find(".toggle-active").click(function(e) {
            $(".cancer-selector").find(".active").removeClass("active");
            $(e.target).parent().addClass("active");
            _this.current_cancer = $(e.target).data("id");
            _.defer(_this.reloadModel);
        });
    },

    initGeneTypeaheads: function(txt) {
        var genelist = txt.trim().split("\n");

        var source_fn = function (q, p) {
            p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function (qi) {
                return _.map(genelist, function (geneitem) {
                    if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                });
            }))));
        };

        var _this = this;
        this.$el.find(".genes-typeahead-x").typeahead({
            source: source_fn,
            updater: function(x) {
                _this.selected_genes["x"] = x;
                _.defer(_this.reloadModel);
                return x;
            }
        });

        this.$el.find(".genes-typeahead-y").typeahead({
            source: source_fn,
            updater: function(y) {
                _this.selected_genes["y"] = y;
                _.defer(_this.reloadModel);
                return y;
            }
        });

        if (this.selected_genes["x"]) this.$el.find(".genes-typeahead-x").val(this.selected_genes["x"]);
        if (this.selected_genes["y"]) this.$el.find(".genes-typeahead-y").val(this.selected_genes["y"]);
    },

    loadData: function() {
        this.feature_map = _.groupBy(this.model.get("items"), "id");
        this.initFeatureLabelSelector();
        this.drawGraph();
    },

    reloadModel: function() {
        console.log("reloadModel:" + this.current_cancer + "," + this.selected_genes["x"] + "," + this.selected_genes["y"]);
        if (!this.current_cancer) return;
        if (!this.selected_genes["x"]) return;
        if (!this.selected_genes["y"]) return;

        var fmxModel = this.model;
        fmxModel.fetch({
            "data": {
                "gene": [this.selected_genes["x"], this.selected_genes["y"]],
                "cancer": this.current_cancer.toLowerCase()
            },
            "traditional": true,
            success: function() {
                fmxModel.trigger("load");
            }
        });
    },

    initFeatureLabelSelector: function() {
        _.each(["x", "y"], function(axis) {
            var UL = this.$el.find(".feature-selector-" + axis);
            UL.empty();

            var selected_gene = this.selected_genes[axis];
            var selected_features = _.filter(this.model.get("items"), function(feature) {
                return (feature.id.indexOf(selected_gene) >= 0);
            });
            _.each(selected_features, function(feature) {
                UL.append(LineItemTemplate({ "label":feature.id, "id":feature.id, "a_class":"selector" }));
            });

            var _this = this;
            UL.find(".selector").click(function(e) {
                _this.selected_features[axis] = $(e.target).data("id");
                _this.drawGraph();
            });
        }, this);
    },

    drawGraph: function() {
        var data_array = this.selectedFeatureData();
        if (_.isEmpty(data_array)) return;

        var plot_data = {
            DATATYPE : "vq.models.ScatterPlotData",
            CONTENTS : {
                PLOT : {
                    width : 768, height: 768,
                    dblclick_notifier : function() {
                    },
                    vertical_padding : 80,
                    horizontal_padding: 80,
                    x_label_displacement: 40,
                    y_label_displacement: -70,
                    x_tick_displacement: 20,
                    enable_transitions: true
                },
                axis_font :"14px helvetica",
                tick_font :"14px helvetica",
                stroke_width: 1,
                radius: 4,
                data_array: data_array,
                regression: "none",
                xcolumnid: this.selected_genes["x"],
                ycolumnid: this.selected_genes["y"],
                valuecolumnid: "id"
            }
        };

        console.log("drawGraph");
        this.$el.find(".scatterplot-container").empty();
        this.$el.find(".scatterplot-container").scatterplot(plot_data);

//        this.$el.find(".scatterplot-container").scatterplot("reset_data", data_array);
        this.$el.find(".scatterplot-container").scatterplot("enable_zoom");
    },

    selectedFeatureData: function() {
        var x_feature = this.selected_features["x"];
        var y_feature = this.selected_features["y"];
        if (_.isEmpty(x_feature) || _.isEmpty(y_feature)) return [];

        var x_features = this.feature_map[x_feature];
        var y_features = this.feature_map[y_feature];
        if (_.isEmpty(x_features) || _.isEmpty(y_features)) return [];

        var x_values = _.first(x_features).values || {};
        var y_values = _.first(y_features).values || {};

        var x_axis = this.selected_genes["x"];
        var y_axis = this.selected_genes["y"];

        var datapoints = _.map(x_values, function(x_val, point_id) {
            var y_val = y_values[point_id];
            if (_.isNumber(x_val) && _.isNumber(y_val)) {
                var dataPoint = {"id": point_id};
                dataPoint[x_axis] = x_val;
                dataPoint[y_axis] = y_val;
                return dataPoint;
            }
        });
        return _.compact(datapoints);
    }
});
