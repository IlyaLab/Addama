// TODO : Figure out better way to get native element types (e.g. this.$el.dataset)
// TODO : Canvas may be required
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
        roots:{},

        init:function (options) {
            if (options) _.extend(this, options);
            console.log("DataMap.init");

            _.bindAll(this, "_initStep", "_computeWindowScale", "_perspective", "_scale", "_translate", "_rotate");
            _.bindAll(this, "_onStepEnter", "_onStepLeave");

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

        goto:function (options) {
            console.log("DataMap.goto:" + options.step);
            var $step = $(options.step);
            var stepId = $step[0].id;

            window.scrollTo(0, 0);

            if (this.activeStep) {
                this.activeStep.removeClass("impress-active");
                this.$el.removeClass("impress-on-" + this.activeStep[0].id);
            }
            $step.addClass("impress-active");

            this.$el.addClass("impress-on-" + stepId);

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
                this.windowScale = computeWindowScale(config);
            }

            var targetScale = target.scale * this.windowScale;

            // trigger leave of currently active element (if it's not the same step again)
            if (this.activeStep && this.activeStep !== $step) {
                this._onStepLeave(this.activeStep);
            }

            // Now we alter transforms of `root` and `canvas` to trigger transitions.
            //
            // And here is why there are two elements: `root` and `canvas` - they are
            // being animated separately:
            // `root` is used for scaling and `canvas` for translate and rotations.
            // Transitions on them are triggered with different delays (to make
            // visually nice and 'natural' looking transitions), so we need to know
            // that both of them are finished.
            this.$el.css({
                // to keep the perspective look similar for different scales
                // we need to 'scale' the perspective, too
                transform:this._perspective(this.perspective / targetScale) + this._scale(targetScale),
                transitionDuration:duration + "ms",
                transitionDelay:(zoomin ? delay : 0) + "ms"
            });

//            this.$canvas.css({
//                transform:rotate(target.rotate, true) + translate(target.translate),
//                transitionDuration:duration + "ms",
//                transitionDelay:(zoomin ? 0 : delay) + "ms"
//            });

            // Here is a tricky part...
            //
            // If there is no change in scale or no change in rotation and translation, it means there was actually
            // no delay - because there was no transition on `root` or `canvas` elements.
            // We want to trigger `impress:stepenter` event in the correct moment, so here we compare the current
            // and target values to check if delay should be taken into account.
            //
            // I know that this `if` statement looks scary, but it's pretty simple when you know what is going on
            // - it's simply comparing all the values.
            if (this.currentState.scale === target.scale ||
                (this.currentState.rotate.x === target.rotate.x && this.currentState.rotate.y === target.rotate.y &&
                    this.currentState.rotate.z === target.rotate.z && this.currentState.translate.x === target.translate.x &&
                    this.currentState.translate.y === target.translate.y && this.currentState.translate.z === target.translate.z)) {
                delay = 0;
            }

            // store current state
            this.currentState = target;
            this.activeStep = $step;

            // And here is where we trigger `impress:stepenter` event.
            // We simply set up a timeout to fire it taking transition duration (and possible delay) into account.
            //
            // I really wanted to make it in more elegant way. The `transitionend` event seemed to be the best way
            // to do it, but the fact that I'm using transitions on two separate elements and that the `transitionend`
            // event is only triggered when there was a transition (change in the values) caused some bugs and
            // made the code really complicated, cause I had to handle all the conditions separately. And it still
            // needed a `setTimeout` fallback for the situations when there is no transition at all.
            // So I decided that I'd rather make the code simpler than use shiny new `transitionend`.
            //
            // If you want learn something interesting and see how it was done with `transitionend` go back to
            // version 0.5.2 of impress.js: http://github.com/bartaz/impress.js/blob/0.5.2/js/impress.js
            var _this = this;
            _.defer(function() {
                _this._onStepEnter(_this.activeStep);
            });
        },

        prev:function () {
            console.log("DataMap.prev");
        },

        next:function () {
            console.log("DataMap.next");
        },

        _initStep:function (el, idx) {
            console.log("_initStep:" + el.id + "," + idx);
            if (!el.id) el.id = "step-" + (idx + 1);

            var step = {
                translate:{
                    x:(el.dataset.x),
                    y:(el.dataset.y),
                    z:(el.dataset.z)
                },
                rotate:{
                    x:(el.dataset.rotateX),
                    y:(el.dataset.rotateY),
                    z:(el.dataset.rotateZ || el.dataset.rotate)
                },
                scale:(el.dataset.scale || 1),
                el:el
            };

            this.stepsData[el.id] = step;

            $(el).css({
                position:"absolute",
                transform:"translate(-50%,-50%)" + this._translate(step.translate) + this._rotate(step.rotate) + this._scale(step.scale),
                transformStyle:"preserve-3d"
            });
        },

        _computeWindowScale:function (config) {
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
            var rX = " rotateX(" + r.x + "deg) ",
                rY = " rotateY(" + r.y + "deg) ",
                rZ = " rotateZ(" + r.z + "deg) ";

            return revert ? rZ + rY + rX : rX + rY + rZ;
        },

        _onStepEnter: function(step) {
            if (this.lastEntered !== step) {
                this.$el.trigger("impress:stepenter", { "step": step });
                this.lastEntered = step;
            }
        },

        _onStepLeave: function(step) {
            if (this.lastEntered === step) {
                this.$el.trigger("impress:stepleave", { "step": step });
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
            if (data == "init") datamap.init(options);
            if (data == "goto") datamap.goto(options);
            if (data == "prev") datamap.prev(options);
            if (data == "next") datamap.next(options);
        }
    };
}(window.jQuery);