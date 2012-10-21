var View = require("./view");
var template = require("./templates/sign_in");

module.exports = View.extend({
    template: template,
    provider: {},

    events: {
        "click .signout-link": "signout"
    },

    initialize: function() {
        _.bindAll(this, "afterRender", "signout");
        this.provider = _.extend({}, this.options.provider);
    },

    getRenderData: function() {
        return this.provider;
    },

    afterRender: function() {
        if (this.provider.user && this.provider.user.pic) {
            this.$el.find(".user-pic").show();
        }

        if (this.provider.active) {
            this.$el.find(".user-details").show();
            this.$el.find(".signin-link").hide();
        } else {
            this.$el.find(".signin-link").show();
            this.$el.find(".user-details").hide();
        }
    },

    signout: function() {
        $.ajax({
            url:"svc/auth/signout/" + this.provider.id,
            method:"GET",
            context: this,
            success:function () {
                this.provider.user = null;
                this.provider.active = false;
                this.refresh();
                this.trigger("signout");
            }
        });
    }
});
