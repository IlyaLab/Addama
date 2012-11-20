!function ($) {
    var RangeSliderControl = function(element) {
        return {
            $el: element,
            storageId: null,
            initialStep:50,
            min:0,
            max:100,

            init: function(options) {
                _.extend(this, options, {"rawValue": options.initialStep});

                var foundStart = localStorage.getItem(this.storageId);
                this.rawValue = (foundStart) ? parseInt(foundStart) : this.initialStep;

                var $el = this.$el;
                var _this = this;
                this.$el.slider({
                    value:this.rawValue,
                    min:this.min,
                    max:this.max,
                    slide:function (event, ui) {
                        _this.rawValue = ui.value;
                        localStorage.setItem(_this.storageId, _this.rawValue);
                        $el.trigger("slide-to", _this.rawValue);
                    }
                });

                this.$el.trigger("slide-to", this.rawValue);
            },

            value: function() {
                return this.rawValue;
            },

            reset:function () {
                localStorage.removeItem(this.storageId);
                this.rawValue = this.initialStep;

                this.$el.trigger("slide-to", this.rawValue);
                this.$el.slider("value", this.rawValue);
            }
        }
    };

    $.fn.range_slider_control = function (options) {
        var ovr = this.data("RangeSliderControl");
        if (!ovr) {
            ovr = RangeSliderControl(this);
            this.data("RangeSliderControl", ovr);
            ovr.init(options);
        }

        if (typeof options == "string") {
            if (options == "value") return ovr.value();
            if (options == "reset") ovr.reset();
        }
    };
}(window.jQuery);
