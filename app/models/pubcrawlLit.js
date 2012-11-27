

module.exports = Backbone.Model.extend({
        //url for this model is the solr connection to retrieve documents related to this node
    urlRoot: 'http://apollo:4080/solr/core0/select/?',
    url: function(){
        return this.urlRoot + "q=%2Btext%3A%28'" + this.genes[0].toLowerCase() + "'%29+%2Btext%3A%28'cancer'%29&fq=pub_date_year:[1991 TO 2012]&qt=distributed_select&sort=pub_date_year desc&wt=json&hl=true&hl.fl=article_title,abstract_text&rows=1000&hl.snippets=100&hl.fragsize=50000&h.mergeContiguous=true";
    },

    initialize: function (options) {
        _.extend(this, options);
    },


    parse: function(response){
         this.docs=[];
         if(response.response.docs != null){
             for (var i=0; i < response.response.docs.length; i++){
                 var doc = response.response.docs[i];
                 if(response.highlighting[doc.pmid] != undefined){
                     if(response.highlighting[doc.pmid].abstract_text != undefined){
                         doc.abstract_text = response.highlighting[doc.pmid].abstract_text;
                     }
                     if(response.highlighting[doc.pmid].article_title != undefined){
                         doc.article_title = response.highlighting[doc.pmid].article_title;
                     }
                 }

                 this.docs.push(doc);
             }
         }

         return;

     }

});
