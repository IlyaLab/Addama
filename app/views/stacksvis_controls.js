var Template = require("../views/templates/stacksvis_controls");

module.exports = Backbone.View.extend({

    events:{
        "click .reset-sliders": function() {
            this.$el.find(".slider_barheight").range_slider_control("reset");
            this.$el.find(".slider_rowspacing").range_slider_control("reset");
            this.$el.find(".slider_barwidth").range_slider_control("reset");
            this.$el.find(".slider_barspacing").range_slider_control("reset");
            this.$el.find(".slider_clusterspacing").range_slider_control("reset");
            this.$el.find(".slider_fontsize").range_slider_control("reset");
            this.$el.find(".slider_label_width").range_slider_control("reset");
        }
    },

    initialState: {
        "slider_barheight":{ min:10, max:50, initialStep:20, "controlProperty": "bar_height" },
        "slider_rowspacing":{ min:10, max:50, initialStep:10, "controlProperty": "row_spacing"  },
        "slider_barwidth":{ min:1, max:10, initialStep:2, "controlProperty": "bar_width"  },
        "slider_barspacing":{ min:0, max:10, initialStep:0, "controlProperty": "column_spacing"  },
        "slider_clusterspacing":{ min:0, max:50, initialStep:10, "controlProperty": "cluster_spacing"  },
        "slider_fontsize":{ min:5, max:21, initialStep:12, "label_fontsize": "label_fontsize"  },
        "slider_label_width":{ min:20, max:200, initialStep:50, "controlProperty": "label_width"  }
    },
    lastLabelWidth: 100,

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "initialValue");

        this.$el.html(Template({}));

        var _this = this;
        _.each(this.initialState, function(inSt, selector) {
            this.$el.find("." + selector).range_slider_control(_.extend(_.clone(inSt), { storageId:selector }));
            this.$el.find("." + selector).bind("slide-to", function(e, value) {
                var updated = {};
                updated[inSt.controlProperty] = value;
                if (_.isEqual(inSt.controlProperty, "label_width")) {
                    _this.lastLabelWidth = value;
                }
                _this.trigger("updated", updated);
            });
        }, this);

        this.$el.find(".show-labels").click(function (e) {
            var btn = $(e.target)
            if (_.isEqual("Show Row Labels", btn.html())) {
                btn.html("Hide Row Labels");
                _this.trigger("updated", { "row_labels_enabled":true, "label_width": _this.lastLabelWidth });
                _this.initialState["row_labels_enabled"] = true;
            } else {
                btn.html("Show Row Labels");
                _this.trigger("updated", { "row_labels_enabled":false, "label_width": 0 });
                _this.initialState["row_labels_enabled"] = false;
            }
        });

        var lastChecked = this.initialState["row_labels_enabled"];
        if (!_.isUndefined(lastChecked) && lastChecked == "false") {
            this.$el.find(".show-labels").html("Show Row Labels");
            _this.trigger("updated", { "row_labels_enabled":false, "label_width": 0 });
        }
    },

    initialValue: function() {
        return {
            bar_height: this.initialState["slider_barheight"].initialStep,
            row_spacing: this.initialState["slider_rowspacing"].initialStep,
            bar_width: this.initialState["slider_barwidth"].initialStep,
            column_spacing: this.initialState["slider_barspacing"].initialStep,
            cluster_spacing: this.initialState["slider_clusterspacing"].initialStep,
            label_fontsize: this.initialState["slider_fontsize"].initialStep,
            label_width: this.initialState["slider_label_width"].initialStep,
            row_labels_enabled: true
        }
    }
});
