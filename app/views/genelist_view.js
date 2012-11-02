var MenuItemsView = require("../views/menu_items");
var ManageGLView = require("../views/genelist_manage");
var ProfiledModel = require("../models/genelist_profiled");
var CustomModel = require("../models/genelist_custom");

module.exports = Backbone.View.extend({
    profiledModel: new ProfiledModel(),
    customModel: new CustomModel(),

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderProfiled", "renderCustom", "genelistSelected");

        var profiledView = new MenuItemsView({ model:this.profiledModel, selectEvent:"genelist-selected" });
        profiledView.on("genelist-selected", this.genelistSelected);

        var customView = new MenuItemsView({ model:this.customModel, selectEvent:"genelist-selected" });
        customView.on("genelist-selected", this.genelistSelected);

        var manageGLView = new ManageGLView({ model:this.customModel });

        this.$el.find(".genelist-profiled").html(profiledView.render().el);
        this.$el.find(".genelist-custom").html(customView.render().el);
        this.$el.find('.genelist-modal').html(manageGLView.render().el);

        this.profiledModel.fetch({ success: this.renderProfiled });
        this.customModel.fetch({ success:this.renderCustom });
    },

    renderProfiled: function() {
        this.profiledModel.trigger("load");
    },

    renderCustom: function() {
        this.customModel.trigger("load");
    },

    genelistSelected: function(genelist) {
        this.trigger("genelist-selected", genelist);
    }
});