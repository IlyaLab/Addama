!function ($) {
    var OncovisSlider = function (element, options) {
        this.target_el = "#" + element.id;
        this.storageId = element.id;
        if (options) _.extend(this, options);
    };

    OncovisSlider.prototype = {
        constructor:OncovisSlider,
        initialStep:50,
        min:0,
        max:100,

        init:function () {
            var foundStart = localStorage.getItem(this.storageId);
            this.rawValue = (foundStart) ? parseInt(foundStart) : this.initialStep;

            var me = this;
            $(this.target_el).slider({
                value:this.rawValue,
                min:this.min,
                max:this.max,
                slide:function (event, ui) {
                    me.rawValue = ui.value;
                    localStorage.setItem(me.storageId, me.rawValue);
                    me._publishValues();
                }
            });

            this._publishValues();
        },

        _resetSliderValue: function() {
            localStorage.removeItem(this.storageId);
            this.rawValue = this.initialStep;
            this._publishValues();
            $(this.target_el).slider("value", this.rawValue);
        },

        _publishValues: function() {
            if (this.slide) {
                this.slide(this.rawValue);
            }
        }
    };

    // jQuery Plugin
    $.fn.oncovis_range = function (options) {
        return this.each(function () {
            var $this = $(this);
            var ft = $this.data("OncovisSlider");
            if (!ft) $this.data("OncovisSlider", (ft = new OncovisSlider(this, options)));
            ft.init();
        });
    };

    $.fn.oncovis_range_value = function () {
        var $this = $(this);
        var ft = $this.data("OncovisSlider");
        if (ft) return ft.rawValue;
        return 0;
    };

    $.fn.oncovis_range_reset = function() {
        var $this = $(this);
        var ft = $this.data("OncovisSlider");
        if (ft) return ft._resetSliderValue();
    };

}(window.jQuery);
