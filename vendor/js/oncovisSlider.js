!function ($) {
    var OncovisSlider = function (element, options) {
        this.element = $(element);
        if (options) _.extend(this, options);
    };

    OncovisSlider.prototype = {
        constructor:OncovisSlider,
        initialStep:50,
        min:0,
        max:100,

        init:function () {
            var $this = $(this);

            var foundStart = localStorage.getItem(this.storageId);
            this.rawValue = (foundStart) ? parseInt(foundStart) : this.initialStep;

            var _this = this;
            this.element.slider({
                value:this.rawValue,
                min:this.min,
                max:this.max,
                slide:function (event, ui) {
                    _this.rawValue = ui.value;
                    localStorage.setItem(_this.storageId, _this.rawValue);
                    $this.trigger("slide-to", _this.rawValue);
                }
            });

            $this.trigger("slide-to", this.rawValue);
        },

        _resetSliderValue: function() {
            localStorage.removeItem(this.storageId);
            this.rawValue = this.initialStep;
            $this.trigger("slide-to", this.rawValue);
            this.element.slider("value", this.rawValue);
        }
    };

    // jQuery Plugin
    $.fn.oncovis_range = function (options) {
        var $this = $(this);
        var ft = $this.data("OncovisSlider");
        if (ft) {
            if (_.isString(options)) {
                if (options == "reset") ft._resetSliderValue();
                if (options == "value") return ft.rawValue;
            }
            return;
        }

        $this.data("OncovisSlider", (ft = new OncovisSlider(this, options)));
        ft.init();
//        this.each(function () {});
    };

    $.fn.oncovis_range_reset = function() {
        var $this = $(this);
        var ft = $this.data("OncovisSlider");
        if (ft) return ft._resetSliderValue();
    };

}(window.jQuery);
