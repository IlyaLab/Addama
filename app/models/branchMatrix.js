var Model = require('./model');

module.exports = Model.extend({

    serviceRoot:'svc',
    serviceRead:'/data',
    serviceDir:'/analysis/rf-branch-matrix/',

    initialize:function (options) {
        _.bindAll(this, 'getHeaders', 'url', 'parse', 'fetch');
        this.analysis_id = options.analysis_id;
        this.dataset_id = options.dataset_id;
        this.feature_ids = options.feature_ids;
    },

    getHeaders:function () {
        return _.keys(this.at(0).toJSON());
    },

    url:function () {
        return this.serviceRoot + this.serviceRead + this.serviceDir + '/' + this.dataset_id;
    },

    parse:function (response) {
        return {data:d3.tsv.parse(response)};
    },

    fetch:function (options) {
        return Model.prototype.fetch.call(this, _.extend({}, options, {dataType:'text'}));
    }

});