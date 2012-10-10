var Model = require('./model');
var REQUIRED = null;

module.exports = Model.extend({
    analysis_id : REQUIRED,
    dataset_id: REQUIRED,

    defaults: {
        ROWS: [],
        COLUMNS: [],
        DATA: [[]]
    },

	initialize: function(options) {
		_.bindAll(this,'url','parse','fetch');
        _.extend(this, options);
	},

	url : function() {
		return "svc/data/analysis/" + this.analysis_id + "/" + this.dataset_id;
	},

	parse : function(tsv_text) {
        var tsv_rows = tsv_text.split("\n");

        this.COLUMNS = _.rest(_.first(tsv_rows).split("\t"), 1);

        _.each(_.rest(tsv_rows, 1), function(tsv_row, tsv_row_idx) {
            var data_values = tsv_row.split("\t");
            this.ROWS.push(_.first(data_values));
            this.DATA[tsv_row_idx] = _.rest(data_values, 1);
        }, this);

		// return d3.tsv.parseRows(response);
        return this.DATA;
	},

	fetch : function(options) {
        return Model.prototype.fetch.call(this,_.extend({},options,{dataType:'text'}));
	}

});