var Model = require('./model');

module.exports = Model.extend({

    serviceRoot:'svc',
    serviceRead:'/data',
    serviceDir:'/analysis/rf-leaves/layouts',

    initialize:function (options) {
        _.bindAll(this, 'getHeaders', 'url', 'parse', 'fetch');
        this.analysis_id = options.analysis_id;
        this.dataset_id = options.dataset_id;
        this.cutoff = options.cutoff;
    },

    getHeaders:function () {
        return _.keys(this.at(0).toJSON());
    },

    url:function () {
        return this.serviceRoot + this.serviceRead + this.serviceDir + '/' + this.dataset_id + "/fiedler/" + this.dataset_id + ".cutoff." + this.cutoff +".json";
    },

    filterFeatures:function(names){
        var data = this.get('branches');
        var filtered=[];
        for (var i = 0; i < data.length; i++) {
            if (_.indexOf(names,data[i][0]) > -1) {
                filtered.push(data[i]);
            }
        }
        return filtered;
    },

    getTopFeaturs:function(name){
        var data = this.get('branches');
        var coli = 0;
        var features = [];
        for (var i = 0; i < data[0].length; i++) {
               if (data[0][i]===name) {
                   coli = i;
                   break;
               }
           }
        for (i = 1; i < data.length; i++) {
               features.push([data[i][0],data[i][coli]]);
           }
        return features.sort(function(a,b){return b[1]-a[1];});
    },

    getD3Data:function() {
        var r1 = this.get("r1");
        var r2 = this.get("r2");
        var n = this.get("nByi");
        var termcat = this.get("termcat");
        var l = r1.length;
        var data = [];
        for (var i = l - 1; i >= 0; i--) {
            data[i]={r1:r1[i],r2:r2[i],n:n[i],termcat:termcat[i]};
        }
        return data;
    }

    /*
    parse:function (response) {
        return {data:d3.tsv.parse(response)};
    },

    fetch:function (options) {
        return Model.prototype.fetch.call(this, _.extend({}, options, {dataType:'text'}));
    }*/

});