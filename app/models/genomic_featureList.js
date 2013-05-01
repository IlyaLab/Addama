var Collection = require('./collection');
var GenomicFeature = require('./genomic_feature');

module.exports = Collection.extend({
	model:GenomicFeature,

	initialize: function(options) {
		_.bindAll(this, 'getHeaders','url','parse','fetch');
		this.analysis_id = options.analysis_id;
		this.dataset_id  = options.dataset_id;
		this.feature_ids = options.feature_ids;
	},

	getHeaders: function() {
			return _.keys(this.at(0).toJSON());
	},

	getAnnotationHeaders: function() {
			return _.reject(this.getHeaders(),function(header) { return _.has(GenomicFeature.prototype.defaults,header);});
	},

	url : function() {
        // TODO : Determine this from the corresponding entry in data model
		return "svc/data/analysis/" + this.analysis_id + '/' + this.dataset_id;
	},

	parse : function(response) {
		return d3.tsv.parse(response);
	},

	fetch : function(options) {
		return Collection.prototype.fetch.call(this,_.extend({},options,{dataType:'text'}));
	}

});