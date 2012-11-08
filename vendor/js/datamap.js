// TODO : Figure out better way to get native element types (e.g. this.$el.dataset)
!function ($) {
    var DataMap = function (element) {
        this.$el = $(element);
        console.log("DataMap(" + element[0].id + ")");
    };

    DataMap.prototype = {
        width:1024,
        height:768,
        maxScale:1,
        minScale:0,
        perspective:1000,
        transitionDuration:1000,

        stepsData:{},
        roots: {},

        init:function (options) {
            if (options) _.extend(this, options);
            console.log("DataMap.init");

            _.bindAll(this, "_initStep", "_computeWindowScale", "_perspective", "_scale", "_translate", "_rotate");

            var rootData = this.$el[0].dataset;
            var config = {
                width:(rootData.width || this.width),
                height:(rootData.height || this.height),
                maxScale:(rootData.maxScale || this.maxScale),
                minScale:(rootData.minScale || this.minScale),
                perspective:(rootData.perspective || this.perspective),
                transitionDuration:(rootData.transitionDuration || this.transitionDuration)
            };

            this.windowScale = this._computeWindowScale(config);

            this.$el.css({
                position:"absolute",
                transformOrigin:"top left",
                transition:"all 0s ease-in-out",
                transformStyle:"preserve-3d",
                top:"50%",
                left:"50%",
                transform:this._perspective(config.perspective / this.windowScale) + this._scale(this.windowScale)
            });

            this.$el.removeClass("impress-disabled");
            this.$el.addClass("impress-enabled");

            // get and init steps
            _.each(this.$el.find(".step"), this._initStep);

            // set a default initial state of the canvas
            this.currentState = {
                translate:{ x:0, y:0, z:0 },
                rotate:{ x:0, y:0, z:0 },
                scale:1
            };

            initialized = true;

            this.$el.trigger("impress:init", { api:this });
        },

        goto:function () {
            console.log("DataMap.goto");
        },

        prev:function () {
            console.log("DataMap.prev");
        },

        next:function () {
            console.log("DataMap.next");
        },

        _initStep:function (el, idx) {
            var data = el.dataset;
            var step = {
                translate:{
                    x:(data.x),
                    y:(data.y),
                    z:(data.z)
                },
                rotate:{
                    x:(data.rotateX),
                    y:(data.rotateY),
                    z:(data.rotateZ || data.rotate)
                },
                scale:(data.scale || 1),
                el:el
            };

            if (!el.id) {
                el.id = "step-" + (idx + 1);
            }

            this.stepsData["impress-" + el.id] = step;

            $(el).css({
                position:"absolute",
                transform:"translate(-50%,-50%)" + this._translate(step.translate) + this._rotate(step.rotate) + this._scale(step.scale),
                transformStyle:"preserve-3d"
            });
        },

        _computeWindowScale: function(config) {
            var hScale = window.innerHeight / config.height;
            var wScale = window.innerWidth / config.width;
            var scale = hScale > wScale ? wScale : hScale;

            if (config.maxScale && scale > config.maxScale) {
                scale = config.maxScale;
            }
            if (config.minScale && scale < config.minScale) {
                scale = config.minScale;
            }
            return scale;
        },

        _perspective: function(p) {
            return " perspective(" + p + "px) "
        },

        _scale: function(s) {
            return " scale(" + s + ") ";
        },

        _translate: function(t) {
            return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
        },

        _rotate: function( r, revert ) {
            var rX = " rotateX(" + r.x + "deg) ",
                rY = " rotateY(" + r.y + "deg) ",
                rZ = " rotateZ(" + r.z + "deg) ";

            return revert ? rZ+rY+rX : rX+rY+rZ;
        }
    };

    $.fn.datamap = function (data, options) {
        var $this = $(this);
        var datamap = $this.data("DataMap");
        if (!datamap) {
            $this.data("DataMap", (datamap = new DataMap(this, options)));
            datamap.init(options);
        }

        if (typeof data == "string") {
            if (data == "init") datamap.init(options);
            if (data == "goto") datamap.goto(options);
            if (data == "prev") datamap.prev(options);
            if (data == "next") datamap.next(options);
        }
    };
}(window.jQuery);