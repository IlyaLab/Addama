var Model = require('./model');

module.exports = Model.extend({

    defaults:{
        source:'',
        target:'',
        weight:50,
        directed:false
    },

    parse:function (response) {
        console.log("edge.parse");
        return {
            source:response[0],
            target:response[1],
            weight:100 || response[2]
        };
    }

});