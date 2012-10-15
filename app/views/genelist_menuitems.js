var View = require('./view');
var LineItemTemplate = require("./templates/line_item");

module.exports = View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderMenuItems");

        this.model.on('load', this.renderMenuItems);
    },

    renderMenuItems: function() {
        var UL = $(".genelist-profiled");
        UL.append('<li class="divider"></li><li class="nav-header">Profiled...</li>');

        var profiledLists = {};
        _.each(this.model.get("profiledLists"), function(profiledList) {
            UL.append(LineItemTemplate(_.extend(profiledList, { "a_class": "select-item" })));
            profiledLists[profiledList["ID"]] = profiledList;
        });

        var _this = this;
        UL.find("li a.select-item").click(function(e) {
            UL.find("i.icon-ok").removeClass("icon-ok");
            $(e.target).find("i").addClass("icon-ok");
            _this.trigger("genelist-selected", profiledLists[$(e.target).data("id")]);
        });
    }
});