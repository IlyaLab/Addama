var Template = require("../views/templates/stacksvis_selectors");
var LineItem = require("../views/templates/line_item");

module.exports = Backbone.View.extend({

    events:{
        "click .selector-apply":function () {
            var selected_rows = this.$el.find(".selected-rows li a");
            var row_data = _.uniq(_.map(selected_rows, function (selected_row) {
                return $(selected_row).data("id");
            }));

            this.trigger("selected", {
                "rows": row_data,
                "cluster": this.$el.find(".cluster-property").val()
            });
        },
        "click .no-cluster": function() {
            this.$el.find(".cluster-property").val("");
        }
    },

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "initTypeahead");

        this.model.on("load", this.initTypeahead);

        this.$el.html(Template({}));

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

        this.$el.find(".cluster-property").typeahead({ source: this.model.get("ROWS") });

        if (this.cluster) {
            this.$el.find(".cluster-property").val(this.cluster);
        }
        if (this.rows) {
            _.each(this.rows, function(row) {
                UL.append(LineItem({ "label":row, "id":row, "a_class":"row-remover", "i_class":"icon-trash" }));
            });
        }
    }

});
