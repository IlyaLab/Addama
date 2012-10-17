var View = require('./view');
var template = require('./templates/modals_cloud_storage');

module.exports = View.extend({
    id:'cloud-storage-view',
    template:template,

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "browse_gdrive_load_item", "take_snapshot_save_to_gdrive", "select_file_save_to_gdrive", "save_session_to_gdrive");

        this.$navbar.find(".gdrive-import").bind("click", this.browse_gdrive_load_item);
        this.$navbar.find(".gdrive-snapshot").bind("click", this.take_snapshot_save_to_gdrive);
        this.$navbar.find(".gdrive-export").bind("click", this.select_file_save_to_gdrive);
        this.$navbar.find(".gdrive-session").bind("click", this.save_session_to_gdrive);
    },

    browse_gdrive_load_item: function() {
        this.$el.find(".gdrive-browse-modal").modal("show");
    },

    take_snapshot_save_to_gdrive: function() {
        this.$el.find(".gdrive-snapshot-modal").modal("show");
    },

    select_file_save_to_gdrive: function() {
        this.$el.find(".gdrive-export-modal").modal("show");
    },

    save_session_to_gdrive: function() {
        this.$el.find(".gdrive-session-modal").modal("show");
    }
});