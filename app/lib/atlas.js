!function ($) {
    var DataMap = function (element) {
        this.$el = $(element);
    };

    DataMap.prototype = {
        width:1024,
        height:768,
        maxScale:1,
        minScale:0,
        perspective:1000,
        transitionDuration:1000,

        stepsData:{},

        init:function (options) {
            if (options) _.extend(this, options);
            console.log("DataMap.init");

            _.bindAll(this, "_initStep", "_computeWindowScale", "_perspective", "_scale", "_translate", "_rotate");
            _.bindAll(this, "_onMaximize", "_onMinimize");

            this.windowScale = this._computeWindowScale();

            this.$el.css({
//                height: "90%",
//                border:"1px solid black",
                overflow:"hidden"
            });

            var rootStyles = {
                position:"absolute",
                transformOrigin:"top left",
                transition:"all 0s ease-in-out",
                transformStyle:"preserve-3d"
            };

            this.$canvas = this.$el.find(".datamap-canvas");
            this.$canvas.css(rootStyles);

            this.$stepWrap = this.$canvas.find(".datamap-container");
            this.$stepWrap.css(_.extend(rootStyles, {
                top:"50%",
                left:"50%",
                transform:this._perspective(this.perspective / this.windowScale) + this._scale(this.windowScale)
            }));

            _.each(this.$stepWrap.find(".atlas-map"), this._initStep);

            // set a default initial state of the canvas
            this.currentState = {
                translate:{ x:0, y:0, z:0 },
                rotate:{ x:0, y:0, z:0 },
                scale:1
            };

            this.$el.trigger("datamap:init", { api:this });
        },

        goto:function (options) {
            var $step = $(options.step);
            var stepId = $step[0].id;
            console.log("DataMap.goto:" + stepId);

            window.scrollTo(0, 0);

            // compute target state of the canvas based on given step
            var stepData = this.stepsData[stepId];
            var target = {
                rotate:{
                    x:-stepData.rotate.x,
                    y:-stepData.rotate.y,
                    z:-stepData.rotate.z
                },
                translate:{
                    x:-stepData.translate.x,
                    y:-stepData.translate.y,
                    z:-stepData.translate.z
                },
                scale:1 / stepData.scale
            };

            // Check if the transition is zooming in or not.
            //
            // This information is used to alter the transition style:
            // when we are zooming in - we start with move and rotate transition
            // and the scaling is delayed, but when we are zooming out we start
            // with scaling down and move and rotation are delayed.
            var zoomin = target.scale >= this.currentState.scale;

            var duration = options.duration || this.transitionDuration;
            var delay = (duration / 2);

            // if the same step is re-selected, force computing window scaling,
            // because it is likely to be caused by window resize
            if ($step === this.activeStep) {
                this.windowScale = this._computeWindowScale();
            }

            var targetScale = target.scale * this.windowScale;

            // trigger leave of currently active element (if it's not the same step again)
            if (this.activeStep && this.activeStep !== $step) {
                this._onMinimize(this.activeStep);
            }

            // Now we alter transforms of `root` and `canvas` to trigger transitions.
            //
            // And here is why there are two elements: `root` and `canvas` - they are
            // being animated separately:
            // `root` is used for scaling and `canvas` for translate and rotations.
            // Transitions on them are triggered with different delays (to make
            // visually nice and 'natural' looking transitions), so we need to know
            // that both of them are finished.
            this.$stepWrap.css({
                // to keep the perspective look similar for different scales
                // we need to 'scale' the perspective, too
                transform:this._perspective(this.perspective / targetScale) + this._scale(targetScale),
                transitionDuration:duration + "ms",
                transitionDelay:(zoomin ? delay : 0) + "ms"
            });

//            this.$canvas.css({
//                transform:this._rotate(target.rotate, true) + this._translate(target.translate),
//                transitionDuration:duration + "ms",
//                transitionDelay:(zoomin ? 0 : delay) + "ms"
//            });

            if (this.currentState.scale === target.scale ||
                (this.currentState.rotate.x === target.rotate.x && this.currentState.rotate.y === target.rotate.y &&
                    this.currentState.rotate.z === target.rotate.z && this.currentState.translate.x === target.translate.x &&
                    this.currentState.translate.y === target.translate.y && this.currentState.translate.z === target.translate.z)) {
                delay = 0;
            }

            // store current state
            this.currentState = target;
            this.activeStep = $step;

            var _this = this;
            _.defer(function () {
                _this._onMaximize(_this.activeStep);
            });
        },

        maximize:function (options) {
            var $step = $(options.step);

            window.scrollTo(0, 0);

            var duration = options.duration || this.transitionDuration;
            var delay = (duration / 2);

            if ($step === this.activeStep) {
                this.windowScale = this._computeWindowScale();
            }

            this.$stepWrap.css({
                transform:this._perspective(this.perspective / this.windowScale) + this._scale(this.windowScale),
                transitionDuration:duration + "ms",
                transitionDelay:delay + "ms"
            });

            this.activeStep = $step;

            var _this = this;
            _.defer(function () {
                _.each(_.values(_this.stepsData), function(step) {
                    $(step.el).trigger("minimize", { "step":step });
                });
                _this._onMaximize(_this.activeStep);
            });
        },

        minimize:function (options) {
            console.log("DataMap.minimize");
        },

        _initStep:function (el, idx) {
            var $stepEl = $(el);
            if (!el.id) el.id = "datamap_item_" + (idx + 1);

            console.log("_initStep(" + idx + "):" + el.id);
            var step = {
                translate:{
                    x:($stepEl.data("x") || 0),
                    y:($stepEl.data("y") || 0),
                    z:($stepEl.data("z") || 0)
                },
                rotate:{
                    x:($stepEl.data("rotateX") || 0),
                    y:($stepEl.data("rotateY") || 0),
                    z:($stepEl.data("rotateZ") || $stepEl.data("rotate") || 0)
                },
                scale:($stepEl.data("scale") || 1),
                el:el
            };

            this.stepsData[el.id] = step;

            $(el).css({
                transform: " scale(1) "
//                transform: " rotateX(180deg) " + this._rotate(step.rotate) + this._scale(step.scale)
            });
        },

        _computeWindowScale:function () {
            var hScale = this.height;
            var wScale = this.width;
            var scale = hScale > wScale ? wScale : hScale;

            if (this.maxScale && scale > this.maxScale) {
                scale = this.maxScale;
            }
            if (this.minScale && scale < this.minScale) {
                scale = this.minScale;
            }
            return scale;
        },

        _perspective:function (p) {
            return " perspective(" + p + "px) "
        },

        _scale:function (s) {
            return " scale(" + s + ") ";
        },

        _translate:function (t) {
            return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
        },

        _rotate:function (r, revert) {
            var rX = r.x ? " rotateX(" + r.x + "deg) " : "";
            var rY = r.y ? " rotateY(" + r.y + "deg) " : "";
            var rZ = r.z ? " rotateZ(" + r.z + "deg) " : "";
            return revert ? rZ + rY + rX : rX + rY + rZ;
        },

        _onMaximize:function (step) {
            if (this.lastEntered !== step) {
                step.trigger("maximize", { "step":step });
                this.lastEntered = step;
            }
        },

        _onMinimize:function (step) {
            if (this.lastEntered === step) {
                step.trigger("minimize", { "step":step });
                this.lastEntered = null;
            }
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
            if (data == "goto") datamap.goto(options);
            if (data == "maximize") datamap.maximize(options);
            if (data == "minimize") datamap.minimize(options);
        }
    };
}(window.jQuery);