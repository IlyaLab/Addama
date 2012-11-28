var AtlasTemplate = require("../views/templates/atlas");
var AtlasMapTemplate = require("../views/templates/atlasmap");
var LineItemTemplate = require("../views/templates/line_item");

module.exports = Backbone.View.extend({
    "last-z-index": 10,
    "currentZoomLevel": 1.0,
    "lastPosition": {
        "top": 0, "left": 0
    },

    events: {
        "click a.refresh-loaded": function() {
            _.each(this.$el.find(".atlas-map"), this.loadMapData);
        },
        "click a.zoom-in": function() {
            this.currentZoomLevel = this.currentZoomLevel * 1.15;
            this.zoom(this.currentZoomLevel);
        },
        "click a.zoom-out": function() {
            this.currentZoomLevel = this.currentZoomLevel * 0.85;
            this.zoom(this.currentZoomLevel);
        },
        "click a.zoom-home": function() {
            this.currentZoomLevel = 1.0;
            this.zoom(this.currentZoomLevel);
        },
        "click a.resize-item": function(e) {
            var li = $(e.target).parents("li");
            if (li.hasClass("active")) {
                this.$el.find(".atlas-map").resizable("destroy");
            } else {
                this.$el.find(".atlas-map").resizable({ "ghost":true});
            }
            li.toggleClass("active");
        },
        "click a.minimize-me": function(e) {
            this.closeMap($(e.target).parents(".atlas-map"));
        },
        "click a.refresh-me": function(e) {
            this.loadMapData($(e.target).parents(".atlas-map"));
        },
        "click a.open-map": function(e) {
            var mapId = $(e.target).data("id");
            _.each(this.model.get("maps"), function(map) {
                if (_.isEqual(map.id, mapId)) {
                    map.isOpen = true;
                    this.appendAtlasMap(map);
                }
            }, this);
        },
        "click div.atlas-map": function(e) {
            var $target = $(e.target);
            if (!$target.hasClass("atlas-map")) {
                $target = $(e.target).parents(".atlas-map");
            }

            $target.css("z-index", this.nextZindex());
        }
    },

    initialize: function(options) {
        _.extend(this, options);
        _.bindAll(this, "initMaps", "appendAtlasMap", "loadMapData", "loadMapContents", "viewsByUri", "closeMap", "zoom");
        _.bindAll(this, "loadCancerList", "initGeneTypeahead", "nextZindex", "nextPosition", "currentState");

        this.$el.html(AtlasTemplate());
        this.$el.find(".atlas-zoom").draggable({ "scroll":true, "cancel": "div.atlas-map" });

        $.ajax({ url:"svc/data/lookups/cancers", type:"GET", dataType:"text", success:this.loadCancerList });
        $.ajax({ url:"svc/data/lookups/genes", type:"GET", dataType:"text", success:this.initGeneTypeahead });

        qed.Sessions.Producers["atlas_maps"] = this;
        this.model.on("load", this.initMaps);
    },

    initMaps: function() {
        var maps = this.model.get("maps");
        _.each(_.sortBy(maps, "label"), function(map) {
            var lit = { "a_class": "open-map", "id": map.id, "label": map.label };
            if (map.disabled) {
                lit = { "li_class": "disabled", "id": map.id, "label": map.label };
            }
            this.$el.find(".maps-selector").append(LineItemTemplate(lit));
        }, this);

        if (qed.Sessions.Active) {
            var session_atlas = qed.Sessions.Active.get("atlas_maps");
            if (session_atlas) {
                if (session_atlas.genes) {
                    var UL = this.$el.find(".gene-selector");
                    UL.empty();
                    _.each(session_atlas.genes, function(gene) {
                        UL.append(LineItemTemplate({ "label":gene, "id":gene, "a_class":"item-remover", "i_class":"icon-trash" }));
                        UL.find(".item-remover").click(function(e) {
                            $(e.target).parent().remove();
                        });
                    });
                }
                
                if (session_atlas.cancers) {
                    _.each(this.$el.find(".cancer-selector li"), function(li) {
                        var cancer = $(li).find("a").data("id");
                        if (session_atlas.cancers.indexOf(cancer) < 0) {
                            $(li).removeClass("active");
                        }
                    })
                }
                if (session_atlas.maps) {
                    maps = _.compact(_.map(session_atlas.maps, function(mapFromSession) {
                        var matchedMap = _.find(maps, function(m) { return _.isEqual(m.id, mapFromSession.id); });
                        if (matchedMap) {
                            return _.extend(_.clone(matchedMap), _.clone(mapFromSession));
                        }
                        return null;
                    }));
                }
            }
        }
        _.each(maps, function(map) {
            if (map.isOpen) this.appendAtlasMap(map);
        }, this);
    },

    appendAtlasMap: function(map) {
        map = _.clone(map);

        var uid = Math.round(Math.random() * 10000);
        _.each(map.views, function(view, idx) {
            if (idx == 0) view["li_class"] = "active";
            view["uid"] = uid++;
        });

        map.assignedPosition = map.position || this.nextPosition();
        map.assignedZindex = map.zindex || this.nextZindex();

        this.$el.find(".atlas-zoom").append(AtlasMapTemplate(map));
        var $atlasMap = this.$el.find(".atlas-zoom").children().last();

        $atlasMap.find(".info-me").popover({
            "title": "Description",
            "trigger": "hover",
            "content": map.description
        });

        var _this = this;
        this.$el.find(".maps-btn").effect("transfer", {
            "to": $atlasMap,
            complete: function() {
                _this.loadMapData($atlasMap);
                $atlasMap.draggable({ "handle": ".icon-move", "scroll": true });
            }
        }, 750);
    },

    loadMapData: function(atlasMap) {
        _.each($(atlasMap).find(".map-contents"), function(mc) {
            _.defer(this.loadMapContents, mc);
        }, this);
    },

    loadMapContents: function(contentContainer, view_options, query_options) {
        var $target = $(contentContainer);
        var source = $target.data("source");
        var view_name = $target.data("view");
        var linked_to = $target.data("linked");
        if (source && view_name) {
            var afn = function(link) {
                return $(link).data("id")
            };

            var cancerList = _.map(this.$el.find(".cancer-selector .active a"), afn);
            var geneList = _.map(this.$el.find(".gene-selector .item-remover"), afn);

            var v_options = _.extend({ "genes": geneList, "cancers": cancerList, "hideSelector": true }, view_options || {});
            var q_options = _.extend({ "gene": geneList, "cancer": cancerList }, query_options || {});

            var downloadUri = this.viewsByUri($target, source, view_name, v_options, q_options);
            $target.parents(".atlas-map").find(".download-link").attr("href", downloadUri);
        }
    },

    viewsByUri: function(targetEl, uri, view_name, options, query) {
//        console.log("viewsByUri(" + uri + "," + view_name + "," + JSON.stringify(options) + "," + JSON.stringify(query) + ")");
        var ViewClass = qed.Views[view_name];
        if (ViewClass) {
            var parts = uri.split("/");
            var data_root = parts[0];
            var analysis_id = parts[1];
            var dataset_id = parts[2];
            var model_unit = qed.Datamodel.get(data_root)[analysis_id];
            var catalog = model_unit.catalog;
            var catalog_unit = catalog[dataset_id];
            var modelName = model_unit.model || catalog_unit.model;
            var serviceUri = catalog_unit.service || model_unit.service || "data/" + uri;
            var Model = qed.Models[modelName || "Default"];

            var model_optns = _.extend(options, {
                "data_uri": "svc/" + serviceUri,
                "analysis_id": analysis_id,
                "dataset_id": dataset_id,
                "model_unit": model_unit,
                "catalog_unit": catalog_unit
            });
            // TODO: Determine which views need annotations
            // qed.FetchAnnotations(dataset_id);

            var model = new Model(model_optns);
            _.defer(function() {
                model.fetch({
                    "data": query,
                    "traditional": true,
                    success:function () {
                        model.trigger("load");
                    }
                });
            });

            var view_options = _.extend({"model":model}, (model_unit.view_options || {}), (options || {}));

            console.log("viewsByUri(" + uri + "," + view_name + "):loading view");
            var view = new ViewClass(view_options);
            $(targetEl).html(view.render().el);

            var qsarray = [];
            _.each(query, function(values, key) {
                if (_.isArray(values)) {
                    _.each(values, function(value) {
                        qsarray.push(key + "=" + value);
                    })
                } else {
                    qsarray.push(key + "=" + values);
                }
            });
            qsarray.push("output=tsv");
            return "svc/" + serviceUri + "?" + qsarray.join("&");
        }
    },

    closeMap: function(atlasMap) {
        $(atlasMap).effect("transfer", {
            "to": this.$el.find(".maps-btn"),
            complete: function() {
                $(atlasMap).remove();
            }
        }, 750);
    },

    zoom: function(zoomLevel) {
        this.$el.find(".atlas-zoom").zoomTo({
            "duration":1000,
            "scalemode": "both",
            "easing": "ease",
            "nativeanimation": true,
            "root": this.$el.find(".atlas-canvas"),
            "closeclick": false,
            "targetsize":zoomLevel
        });
    },

    loadCancerList: function(txt) {
        var cancerList = txt.trim().split("\n");
        var UL = this.$el.find(".cancer-selector");
        _.each(cancerList, function(cancer) {
            UL.append(LineItemTemplate({"li_class":"active","a_class":"toggle-active","id":cancer,"label":cancer}));
        });

        UL.find(".toggle-active").click(function(e) {
            $(e.target).parent().toggleClass("active");
        });

        UL.sortable();
    },

    initGeneTypeahead: function(txt) {
        var genelist = txt.trim().split("\n");

        var UL = this.$el.find(".gene-selector");
        this.$el.find(".genes-typeahead").typeahead({
            source:function (q, p) {
                p(_.compact(_.flatten(_.map(q.toLowerCase().split(" "), function (qi) {
                    return _.map(genelist, function (geneitem) {
                        if (geneitem.toLowerCase().indexOf(qi) >= 0) return geneitem;
                    });
                }))));
            },

            updater:function (gene) {
                UL.append(LineItemTemplate({ "label":gene, "id":gene, "a_class":"item-remover", "i_class":"icon-trash" }));
                UL.find(".item-remover").click(function(e) {
                    $(e.target).parent().remove();
                });
                return "";
            }
        });

        UL.find(".item-remover").click(function(e) {
            $(e.target).parent().remove();
        });

        UL.sortable();
    },

    nextZindex: function() {
        var nextZindex = 1 + this["last-z-index"];
        this["last-z-index"] = nextZindex;
        return nextZindex;
    },

    nextPosition: function() {
        var lastPos = {
            "left": this.lastPosition.left + 50,
            "top": this.lastPosition.top + 50
        };
        this.lastPosition = lastPos;
        return lastPos;
    },

    currentState:function () {
        var openMaps = _.map(this.$el.find(".atlas-map"), function (map) {
            var mapid = $(map).data("mapid");
            var top = map.style["top"].replace("px", "");
            var left = map.style["left"].replace("px", "");
            var zindex = map.style["z-index"];
            return { "id":mapid, "isOpen":true, "position":{ "top":top, "left":left }, "zindex": zindex };
        });

        var afn = function(link) {
            return $(link).data("id")
        };

        return {
            "genes": _.map(this.$el.find(".gene-selector .item-remover"), afn),
            "cancers": _.map(this.$el.find(".cancer-selector .active a"), afn),
            "maps": openMaps
        }
    }
});