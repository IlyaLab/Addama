var Template = require('../views/templates/scatterplot');
var LineItemTemplate = require("./templates/line_item");

module.exports = Backbone.View.extend({
    className: "row-fluid",
    current_cancer: null,
    selected_genes: { "x":"TP53", "y": "KRAS" },
    selected_features: { "x":null, "y": null },

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, "initCancerSelector", "initGeneTypeaheads", "drawGraph", "selectedFeatureData");
        _.bindAll(this, "loadData", "reloadModel", "initFeatureLabelSelector", "getFeatureAxisLabel");

        $.ajax({ url:"svc/data/lookups/genes", type:"GET", dataType:"text", success:this.initGeneTypeaheads });

        if (this.genes && this.genes.length >= 2) {
            this.selected_genes.x = this.genes[0];
            this.selected_genes.y = this.genes[1];
        }

        this.$el.html(Template({}));
        if (_.isEmpty(this.cancers)) {
            $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.initCancerSelector });
        } else {
            this.current_cancer = _.first(this.cancers);
            this.initCancerSelector(this.cancers.join("\n"));
        }

        this.model.on("load", this.loadData);
    },

    initCancerSelector: function(txt) {
        var cancers = txt.trim().split("\n");
        var _this = this;
        _.each(cancers, function(cancer, idx) {
            cancer = cancer.trim();
            if (_.isEqual(_this.current_cancer, cancer)) {
                _this.$el.find(".cancer-selector").append(LineItemTemplate({"li_class":"active","a_class":"toggle-active","id":cancer,"label":cancer}));
            } else {
                _this.$el.find(".cancer-selector").append(LineItemTemplate({"a_class":"toggle-active","id":cancer,"label":cancer}));
            }
        });

        this.$el.find(".cancer-selector").find(".toggle-active").click(function(e) {
            _this.$el.find(".cancer-selector").find(".active").removeClass("active");
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
                "cancer": this.current_cancer
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

            if (!_.isEmpty(selected_features)) {
                this.selected_features[axis] = _.first(selected_features).id;
            }

            var _this = this;
            UL.find(".selector").click(function(e) {
                _this.selected_features[axis] = $(e.target).data("id");
                _this.drawGraph();
            });
        }, this);
    },

    drawKDE: function() {
        var x_feature = this.selected_features["x"],
            y_feature = this.selected_features["y"],
            x_axis = this.getFeatureAxisLabel("x"),
            y_axis = this.getFeatureAxisLabel("y"),
            x_features = this.feature_map[x_feature],
            y_features = this.feature_map[y_feature];

        if (_.isEmpty(x_features) || _.isEmpty(y_features)) return [];

        var x_values = _.first(x_features).values || {};
        var y_values = _.first(y_features).values || {};

        //just take x and y values.  can't handle id's yet.
        var data_array = _.compact(_.map(x_values, function(x_val,index) {
            if (x_val === 'NA' || y_values[index] === 'NA') {return undefined;}
            var obj = {};
            obj[x_axis] = x_val;
            obj[y_axis] = y_values[index];
            return obj;
        }));

        var partitioned_data = {};

        if(this.isNominal(x_feature)) {
            _.each(_.groupBy(data_array,x_axis),function(grouped_values, key) {
                partitioned_data[key] = _.pluck(grouped_values,y_axis);
            });
        } else {
            _.each(_.groupBy(data_array,y_axis),function(grouped_values, key) {
                partitioned_data[key] = _.pluck(grouped_values,x_axis);
            });
        }

        var pairs = _.pairs(partitioned_data);

        pairs.sort(function(a,b) {
            if (a[0] === 'NA') { return 1;}
            else if (b[0] === 'NA') { return -1; }
            return a[0] <= b[0] ? -1 : 1;
        }); //alphabetically/numerically sort the labels except NA goes last

        var labels = _.pluck(pairs,0); //pull the labels out
        var data = _.pluck(pairs,1); //pull the data arrays out

        var plot = kde_plot()
            .data(data)  //array of arrays of continuous data.  each array of data represents one value/category
            .height(320)
            .width(720)
            .margin({top:40, bottom:40, left:50, right:30})
            .renderPoints(true)
            .renderCounts(true)
            .renderMedian(true)
            .categoryLabels(labels)  //array of category labels
            .xAxisLabel(x_axis)  //print x axis label
            .yAxisLabel(y_axis);   //print y axis label

        this.$el.find(".scatterplot-container").empty();
        plot('.scatterplot-container');

    },

    isNominal: function(label) {
        if (label[0] === 'C' || label[0] ==='B') return true;
        return false;
    },

    drawGraph: function() {
        var data_array = this.selectedFeatureData();
        if (_.isEmpty(data_array)) return;

        var x_feature = this.selected_features["x"];
        var y_feature = this.selected_features["y"];
        if(this.isNominal(x_feature) != this.isNominal(y_feature)) {  //if one feature is nominal and the other isn't
            this.drawKDE();  //draw the KDE
            return; //and get out
        }

        var plot_data = {
            DATATYPE : "vq.models.ScatterPlotData",
            CONTENTS : {
                PLOT : {
                    width : 600,
                    height: 600,
                    vertical_padding : 40,
                    horizontal_padding: 80,
                    enable_transitions: true
                },
                axis_font :"14px helvetica",
                tick_font :"8px helvetica",
                stroke_width: 1,
                radius: 3,
                data_array: data_array,
                regression: "none",
                xcolumnid: this.getFeatureAxisLabel("x"),
                ycolumnid: this.getFeatureAxisLabel("y"),
                valuecolumnid: "id"
            }
        };

        console.log("drawGraph");
        if (!this.isPastFirstTime) {
//            this.$el.find(".scatterplot-container").empty();
            this.$el.find(".scatterplot-container").scatterplot(plot_data);
            this.isPastFirstTime = true;
        } else {
            this.$el.find(".scatterplot-container").scatterplot("reset_data", data_array);
        }

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

        var x_axis = this.getFeatureAxisLabel("x");
        var y_axis = this.getFeatureAxisLabel("y");

        var datapoints = _.map(x_values, function(x_val, point_id) {
            var y_val = y_values[point_id];
            if (!_.isEqual(x_val, "NA") && !_.isEqual(y_val, "NA")) {
                var dataPoint = {"id": point_id};
                dataPoint[x_axis] = x_val;
                dataPoint[y_axis] = y_val;
                return dataPoint;
            }
        });
        return _.compact(datapoints);
    },

    getFeatureAxisLabel: function(axis) {
        var features = this.feature_map[this.selected_features[axis]];
        if (features) {
            var featureArray = _.groupBy(features, "cancer")[this.current_cancer.toLowerCase()];
            if (!_.isEmpty(featureArray)) {
                var feature = _.first(featureArray);
                return feature.label + " " + feature.source + " (" + feature.modifier + ")";
            }
        }
        return this.selected_features[axis];
    }
});
