var View = require('./view');
var template = require('./templates/oncovis_select_rows');
var FeatureMatrix2 = require('../models/featureMatrix2');
var LineItem = require("./templates/line_item");

module.exports = View.extend({
    model:FeatureMatrix2,
    template:template,

    events:{
        "click .rows-select":function (e) {
            var selected_rows = this.$el.find(".selected-rows li a");
            var row_data = _.uniq(_.map(selected_rows, function (selected_row) {
                return $(selected_row).data("id");
            }));
            this.trigger("selected-rows", row_data);
        }
    },

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "initTypeahead");

        this.model.on('load', this.initTypeahead);
    },

    afterRender: function() {
        this.$el.find(".selected-rows ul, li").disableSelection();
        this.$el.find(".selected-rows").sortable({ revert:true });
    },

    initTypeahead:function () {
        var UL = this.$el.find(".selected-rows");
        UL.find("a.row-remover").live("click", function (e) {
            $(e.target).parent().remove();
        });
        this.$el.find(".row-selector").typeahead({
            source:this.model.get("ROWS"),
            updater:function (row) {
                UL.append(LineItem({ "label":row, "id":row, "a_class":"row-remover", "i_class":"icon-trash" }));
                return "";
            }
        });
    }

});
