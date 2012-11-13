var View = require('./view');
var template = require('./templates/scatterplot');

module.exports = View.extend({
    template: template,
    label: "Scatterplot",
    className: "row-fluid",

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this,
            'afterRender',
            'initControls',
            'initFeatureLabelTypeahead',
            'initFeatureSourcesSelect',
            'initGeneTypeaheads',
            'initGraph',
            'initSubtypeDropdown',
            'isFeatureOfInterest',
            'updateSubtype',
            'updateGraph',
            'parseFeatureData',
            'loadFeatures1',
            'loadFeatures2');
        
        $.ajax({
            url:"svc/data/lookups/genes",
            type:"GET",
            dataType:"text",
            success:this.initGeneTypeaheads
        });

        $.ajax({
            url:"svc/data/lookups/cancers",
            type:"GET",
            dataType:"text",
            success:this.initSubtypeDropdown
        });

        $.ajax({
            url:"svc/data/lookups/features_of_interest",
            type:"GET",
            dataType:"text",
            success:this.initFeatureSourcesSelect
        });

        this.drawGraph = _.once(this.initGraph);

        this.feature_matrix = 'fmx_newMerge_05nov';
        this.feature_label_field = 'id';

        this.data = {
            subtype: 'BRCA',
            gene1: 'TP53',
            gene2: 'TP53',
            source1: 'GNAB',
            source2: 'GNAB'
        }
    },

    afterRender: function () {
        this.initControls();
    },

    initControls: function () {
        var that = this;
        
        this.$el.find(".feature1-options .feature-label-select").change(function() {
            that.data.feature_id_1 = that.$el.find(".feature1-options .feature-label-select").val();
            that.loadFeatures1();
            that.parseFeatureData();
        });

        this.$el.find(".feature2-options .feature-label-select").change(function() {
            that.data.feature_id_2 = that.$el.find(".feature2-options .feature-label-select").val();
            that.loadFeatures2();
            that.parseFeatureData();
        });
    },

    initSubtypeDropdown: function(txt) {
        var that = this;
        var cancerlist = txt.trim().split("\n");

        _.each(cancerlist, function(subtype) {
            var html = '<option>' + subtype + '</option>';
            that.$el.find(".subtype-select").append(html);
        });

        this.$el.find(".subtype-select").change(function(e) {
            var subtype = that.$el.find(".subtype-select").val();
            that.updateSubtype(subtype);
        });
    },

    initFeatureSourcesSelect: function(txt) {
        var that = this,
            items = txt.trim().split("\n");

        this.features_of_interest = _.map(items, function (line) {
            var split = line.split("\t");
            return { "label":split[0], "regexp":split[1]};
        });

        _.each(this.features_of_interest, function(s) {
            var html = '<option>' + s.label + '</option>';
            that.$el.find(".featuresource-select").append(html);
        });

        this.$el.find(".feature1-options .featuresource-select").change(function() {
            that.data.source1 = that.$el.find(".feature1-options .featuresource-select").val();
            that.loadFeatures1();
        });

        this.$el.find(".feature2-options .featuresource-select").change(function() {
            that.data.source2 = that.$el.find(".feature2-options .featuresource-select").val();
            that.loadFeatures2();
        });
    },

    initGeneTypeaheads: function(txt) {
        var that = this;
        this.genelist = txt.trim().split("\n");

        var source_fn = function (q, p) {
            p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function (qi) {
                return _.map(that.genelist, function (geneitem) {
                    if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                });
            }))));
        };

        this.$el.find(".genes-typeahead").typeahead({
            source: source_fn
        });

        this.$el.find(".genes-typeahead").val(this.data.gene1);
    },

    initGraph: function () {
        var plot_data = {
            DATATYPE : "vq.models.ScatterPlotData",
            CONTENTS : {
                PLOT : {
                    width : 768, height: 768,
                    dblclick_notifier : function() {},
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
                data_array: this.data.plot_array,
                regression: 'none',
                xcolumnid: 'x',
                ycolumnid: 'y',
                valuecolumnid: 'id'
            }
        };

        this.$el.find(".scatterplot-container").scatterplot(plot_data);
        this.trigger("post-render");
    },

    updateGraph: function() {
        this.drawGraph();

        this.$el.find(".scatterplot-container").scatterplot('reset_data', this.data.plot_array);
        this.$el.find(".scatterplot-container").scatterplot("enable_zoom");
    },

    updateSubtype: function(subtype) {
        this.data.subtype = subtype;
    },

    parseFeatureData: function() {
        var that = this,
            data = this.data;

        if (data.feature_id_1 === undefined || data.feature_id_2 === undefined) {
            return;
        }

        var values1 = data.feature_map_1[data.feature_id_1].values;
        var values2 = data.feature_map_2[data.feature_id_2].values;

        data.plot_array = [];

        _.each(values1, function(v1, key) {
            var v2 = values2[key];

            if (v1 != 'NA' && v2 != 'NA')
            that.data.plot_array.push({
                x: v1,
                y: v2,
                id: key
            });
        });

        this.updateGraph();
    },

    isFeatureOfInterest:function (feature_id) {
        return _.any(this.features_of_interest, function (foi) {
            var queryPattern = foi.regexp.replace(/\*/g, ".*?");
            var queryRegex = new RegExp(queryPattern, 'gi');
            return queryRegex.test(feature_id);
        });
    },

    initFeatureLabelTypeahead: function(feature_number) {
        var that = this,
            options_selector,
            features,
            feature_labels;

        if (feature_number == 1) {
            options_selector = ".feature1-options";
            features = this.data.features1;
        }
        else {
            options_selector = ".feature2-options";
            features = this.data.features2;
        }

        feature_labels = _
            .chain(features)
            .pluck(this.feature_label_field)
            .value();

        var selector = options_selector + " .feature-label-select";
        this.$el.find(selector + " option").remove();

        that.$el.find(selector).append('<option value="-1">select feature ... </option>');
        _.each(feature_labels, function(label) {
            var html = '<option>' + label + '</option>';
            that.$el.find(selector).append(html);
        });
    },

    buildAllFeaturesQuery: function(subtype, gene) {
        var feature_query = "?cancer=" + subtype.toLowerCase() + "&gene=" + gene;
        return "/svc/lookups/qed_lookups/" + this.feature_matrix + "/" + feature_query;
    },

    buildFeatureMap: function(features) {
        return _.reduce(features, function(memo, f) {
            memo[f.id] = f;
            return memo;
        }, {});
    },

    loadFeatures1: function() {
        var that = this,
            query = this.buildAllFeaturesQuery(this.data.subtype, this.data.gene1);

        $.ajax({
            type: 'GET',
            url: query,
            context: this,
            success: function(json) {
                var features = _.filter(json.items, function(f) {
                    return that.isFeatureOfInterest(f.id);
                });

                if (features.length > 0) {
                    that.data.features1 = features;
                    that.data.feature_map_1 = that.buildFeatureMap(features);
                    that.initFeatureLabelTypeahead(1);
                }
                else {
                    that.data.features1 = undefined;
                    that.data.feature_map_1 = undefined;
                    that.data.feature_id_1 = undefined;
                }
            }
        });
    },

    loadFeatures2: function() {
        var that = this,
            query = this.buildAllFeaturesQuery(this.data.subtype, this.data.gene2);

        $.ajax({
            type: 'GET',
            url: query,
            context: this,
            success: function(json) {
                var features = _.filter(json.items, function(f) {
                    return that.isFeatureOfInterest(f.id);
                });

                if (features.length > 0) {
                    that.data.features2 = features;
                    that.data.feature_map_2 = that.buildFeatureMap(features);
                    that.initFeatureLabelTypeahead(2);
                }
                else {
                    that.data.features2 = undefined;
                    that.data.feature_map_2 = undefined;
                    that.data.feature_id_2 = undefined;
                }
            }
        });
    }
});
