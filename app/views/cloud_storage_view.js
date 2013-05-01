var Template = require("./templates/modals_cloud_storage");

module.exports = Backbone.View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "browse_gdrive_load_item", "take_snapshot_save_to_gdrive", "select_file_save_to_gdrive", "save_session_to_gdrive");

        $("body").append(Template());

        $(".gdrive-import").click(this.browse_gdrive_load_item);
        $(".gdrive-snapshot").click(this.take_snapshot_save_to_gdrive);
        $(".gdrive-export").click(this.select_file_save_to_gdrive);
        $(".gdrive-session").click(this.save_session_to_gdrive);
    },

    browse_gdrive_load_item: function() {
        $(".gdrive-browse-modal").modal("show");
    },

    take_snapshot_save_to_gdrive: function() {
        $(".gdrive-snapshot-modal").modal("show");
    },

    select_file_save_to_gdrive: function() {
        $(".gdrive-export-modal").modal("show");
    },

    save_session_to_gdrive: function() {
        $(".gdrive-session-modal").modal("show");
    }
});