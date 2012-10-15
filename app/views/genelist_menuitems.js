var View = require('./view');
var ListHeaderTemplate = require("./templates/list_header");
var LineItemTemplate = require("./templates/line_item");

module.exports = View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderMenuItems");

        this.model.on('load', this.renderMenuItems);
    },

    renderMenuItems: function() {
        $(".genelist-profiled").append(ListHeaderTemplate({"header": "Profiled..."}));

        var profiledLists = {};
        _.each(this.model.get("profiledLists"), function(profiledList) {
            $(".genelist-profiled").append(LineItemTemplate(_.extend(profiledList, { "a_class": "select-item" })));
            profiledLists[profiledList["ID"]] = profiledList;
        });

        var _this = this;
        $(".genelist-profiled li a.select-item").click(function(e) {
            $(".genelist-profiled i.icon-ok").removeClass("icon-ok");
            $(e.target).find("i").addClass("icon-ok");
            _this.trigger("genelist-selected", profiledLists[$(e.target).data("id")]);
        });
    }
});