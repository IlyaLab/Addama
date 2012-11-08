!function ($) {
    var DataMap = function (element, options) {
        this.element = $(element);
        if (options) _.extend(this, options);
    };

    DataMap.prototype = {
        constructor:DataMap,

        width: 1024,
        height: 768,
        maxScale: 1,
        minScale: 0,
        perspective: 1000,
        transitionDuration: 1000,

        init:function (options) {
            if (options) _.extend(this, options);
            console.log("DataMap.init");
        },

        goto:function() {
            console.log("DataMap.goto");
        },

        prev:function() {
            console.log("DataMap.prev");
        },

        next:function() {
            console.log("DataMap.next");
        }
    };

    $.fn.datamap = function (data, options) {
        var $this = $(this);
        var datamap = $this.data("DataMap");
        if (!datamap) $this.data("DataMap", (datamap = new DataMap(this, options)));

        if (typeof data == "string") {
            if (data == "goto") datamap.goto(options);
            if (data == "prev") datamap.prev(options);
            if (data == "next") datamap.next(options);
        }
    };
}(window.jQuery);