var Model = require('./model')

module.exports = Model.extend({

    defaults:{
        chr:'',
        start:-1,
        stop:-1,
        strand:'',

        type:'',
        source:'',
        label:'',
        modifier:'',
        feature_id:''

    },

    parse:function (response) {
        var feature = response.feature_id.split(':');

        response.label = qed.Lookups.Labels[response.feature_id] || feature[2];
        response.type = feature[0];
        response.source = feature[1];

        response.chr = feature[3].slice(3);
        response.start = feature[4];
        response.stop = feature[5];
        response.strand = feature[6];
        response.modifier = feature[8];

        return response;
    }

});
