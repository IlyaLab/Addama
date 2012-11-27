
module.exports= Backbone.View.extend({

    initialize: function(){

        this.$el.html('<div id="pubcrawlLitView"></div>');
        this.model.bind("reset", this.render, this);
        _.bindAll(this, "loadData");
        this.model.on("load", this.loadData);
      },

      loadData: function() {

        this.render();

      },


    render: function(){
        if(this.model == null || this.model.docs == null){
               return this;
        }
        var docConfig = [{headerName:'PMID', headerWidth: '10%', propName:'pmid', urlLink:'http://www.ncbi.nlm.nih.gov/pubmed/'},
            {headerName:'Title', headerWidth: '50%', propName: 'article_title'},
            {headerName:'Pub. Year', headerWidth: '10%', propName: 'pub_date_year'}];

        var expConfig = [{propName:'abstract_text'}];

        var ViewClass = qed.Views['datatable'];
        this.docView = new ViewClass({dataConfig: docConfig, expandedConfig: expConfig, checkbox: false, tableId: "pubcrawlLitTable",model: this.model.docs});
        this.$el.find("#pubcrawlLitView").html(this.docView.render().el);


        return this;
    }
});
