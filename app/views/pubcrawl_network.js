var Template = require('./templates/pubcrawl_network');


var NodeTableView = Backbone.View.extend({

    initialize: function(){

        this.$el.html('<div id="nodeDetails"></div>');
        this.model.bind("reset", this.render, this);
    },


    render: function(){

        var tabs = '<ul class="nav nav-tabs" id="nodeDetailsTabs">' +
            '<li class="active"><a id="qfDocTab" href="#docTableView" data-toggle="tab">Medline Documents</a></li>' +
            '<li><a id="qfNMDTab" href="#nmdTableView" data-toggle="tab">NMD Connections</a></li>' +
            '<li><a id="qfDomineTab" href="#domineTableView" data-toggle="tab">Domine Connections</a></li>' +
            '</ul>' +
            '<div class="tab-content">' +
            '<div class="tab-pane active queryfiltertable" id="docTableView"></div>' +
            '<div class="tab-pane queryfiltertable" id="nmdTableView">' +
            '</div>' +
            '<div class="tab-pane queryfiltertable" id="domineTableView"></div>' +
            '</div>';

        this.$el.find("#nodeDetails").html(tabs);

        var docConfig = [{headerName:'PMID', headerWidth: '10%', propName:'pmid', urlLink:'http://www.ncbi.nlm.nih.gov/pubmed/'},
            {headerName:'Title', headerWidth: '50%', propName: 'article_title'},
            {headerName:'Pub. Year', headerWidth: '10%', propName: 'pub_date_year'}];

        var expConfig = [{propName:'abstract_text'}];
        var ViewClass = qed.Views['datatable'];
        this.docView = new ViewClass({dataConfig: docConfig, expandedConfig: expConfig, checkbox: false, tableId: "docTable",model: this.model.docs});
        this.$el.find("#docTableView").html(this.docView.render().el);

        var nmdConfig = [{headerName:'Name', headerWidth: '30%', propName:'name'},
            {headerName:'Term Single Count', headerWidth: '10%', propName: 'termcount'},
            {headerName:'Term Combo Count', headerWidth: '10%', propName: 'combocount'},
            {headerName:'NMD', headerWidth: '10%', propName: 'nmd'}];

        this.nmdView = new ViewClass({dataConfig: nmdConfig, checkbox: false, tableId: "nmdTable",model: this.model.nmdDetailsModel});
        this.$el.find("#nmdTableView").html(this.nmdView.render().el);

        var dataConfig = [{headerName:'Term1', headerWidth: '30%', propName:'term1'},
            {headerName:'Term2', headerWidth: '10%', propName: 'term2'},
            {headerName:'UniProt ID1', headerWidth: '10%', propName: 'uni1'},
            {headerName:'UniProt ID2', headerWidth: '10%', propName: 'uni2'},
            {headerName:'Domain 1', headerWidth: '10%', propName: 'pf1'},
            {headerName:'Domain 2', headerWidth: '10%', propName: 'pf2'},
            {headerName:'Type', headerWidth: '10%', propName: 'type'},
            {headerName:'Domain 1 Count', headerWidth: '10%', propName: 'pf1_count'},
            {headerName:'Domain 2 Count', headerWidth: '10%', propName: 'pf2_count'}];

        this.domineView = new ViewClass({dataConfig: dataConfig, checkbox: false, tableId: "domineTable",model: this.model.domineDetailsModel});
        this.$el.find("#domineTableView").html(this.domineView.render().el);

        return this;
    }
});

var EdgeTableView = Backbone.View.extend({

    initialize: function(){
        this.$el.html('<div id="edgeDetails"></div>');
               this.model.bind("reset", this.render, this);
    },


    render: function(){

        var tabs = '<ul class="nav nav-tabs" id="edgeDetailsTabs">' +
            '<li class="active"><a id="qfDocTab" href="#edocTableView" data-toggle="tab">Medline Documents</a></li>' +
            '<li><a id="qfNMDTab" href="#enmdTableView" data-toggle="tab">NMD Connections</a></li>' +
            '<li><a id="qfDomineTab" href="#edomineTableView" data-toggle="tab">Domine Connections</a></li>' +
            '</ul>' +
            '<div class="tab-content">' +
            '<div class="tab-pane active queryfiltertable" id="edocTableView"></div>' +
            '<div class="tab-pane queryfiltertable" id="enmdTableView">' +
            '</div>' +
            '<div class="tab-pane queryfiltertable" id="edomineTableView"></div>' +
            '</div>';

        this.$el.find("#edgeDetails").html(tabs);

        var docConfig = [{headerName:'PMID', headerWidth: '5%', propName:'pmid', urlLink:'http://www.ncbi.nlm.nih.gov/pubmed/'},
            {headerName:'Title', headerWidth: '50%', propName: 'article_title'},
            {headerName:'Pub. Year', headerWidth: '5%', propName: 'pub_date_year'}];

        var expConfig = [{propName:'abstract_text'}];
        var ViewClass = qed.Views['datatable'];
        this.docView = new ViewClass({dataConfig: docConfig, expandedConfig: expConfig, checkbox: false, tableId: "docTable",model: this.model.docs});
        this.$el.find("#edocTableView").html(this.docView.render().el);

        var nmdConfig = [{headerName:'Term1', headerWidth: '20%', propName:'term1'},
            {headerName: 'Term2', headerWidth: '20%', propName: 'term2'},
            {headerName:'Term Single Count', headerWidth: '10%', propName: 'termcount'},
            {headerName:'Term Combo Count', headerWidth: '10%', propName: 'combocount'},
            {headerName:'NMD', headerWidth: '20%', propName: 'nmd'}];

        this.nmdView = new ViewClass({dataConfig: nmdConfig, checkbox: false, tableId: "nmdTable",model: this.model.nmdDetailsModel});
        this.$el.find("#enmdTableView").html(this.nmdView.render().el);

        var dataConfig = [{headerName:'Term1', headerWidth: '10%', propName:'term1'},
            {headerName:'Term2', headerWidth: '10%', propName: 'term2'},
            {headerName:'UniProt ID1', headerWidth: '10%', propName: 'uni1'},
            {headerName:'UniProt ID2', headerWidth: '10%', propName: 'uni2'},
            {headerName:'Domain 1', headerWidth: '10%', propName: 'pf1'},
            {headerName:'Domain 2', headerWidth: '10%', propName: 'pf2'},
            {headerName:'Type', headerWidth: '10%', propName: 'type'},
            {headerName:'Domain 1 Count', headerWidth: '10%', propName: 'pf1_count'},
            {headerName:'Domain 2 Count', headerWidth: '10%', propName: 'pf2_count'}];

        this.domineView = new ViewClass({dataConfig: dataConfig, checkbox: false, tableId: "domineTable",model: this.model.domineDetailsModel});
        this.$el.find("#edomineTableView").html(this.domineView.render().el);

        return this;
    }
});

module.exports = Backbone.View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "loadData");

        this.$el.html(Template({}));
        $("#pubcrawlGraphTabs").tabs();
        this.model.on("load", this.loadData);
    },

    loadData: function() {

      this.render(650,350);

    },


    render: function(width,height){

            var width = width,
                height = height,
                that=this;

        if(this.model == null || this.model.networkData == null){
                        return this;
                    }

        var svg = d3.select("#pubcrawlNetworkView").append("svg:svg")
                      .attr("width", width)
                      .attr("height", height);


                  this.vis=svg;



            var force = d3.layout.force()
                .nodes(this.model.networkData.nodes.models)
                .links(this.model.networkData.edges.models)
                .size([width, height])
                .linkDistance(
                    function(d){
                        if(d.nmd != null){
                            return (d.nmd)*350;
                        }
                        return 350;
                    })
                .charge(-300)
                .on("tick", tick);

            var line = svg.append("svg:g").selectAll("line.link")
                .data(force.links())
            .enter().append("line")
                .attr("class", function(d) { return "link " + d.relType; })
                .attr("x1", function(d){ return d.source.x;})
                .attr("y1", function(d){ return d.source.y;})
                .attr("x2", function(d){ return d.target.x;})
                .attr("y2", function(d){ return d.target.y;})
                .on("mouseover", linkMouseover)
                .on("mouseout", mouseout)
                .on("click", triggerEdgeDetailsView);

             var circle = svg.append("svg:g").selectAll("circle")
                .data(force.nodes())
            .enter().append("svg:circle")
                 .attr("class", "node")
                 .attr("cx", function(d){ return d.x;})
                 .attr("cy", function(d){ return d.y;})
                 .style("fill", function(d){
                           if(d.nodeType == "deNovo"){
                               return "#005B00";
                           }
                           else if(d.tf==0)
                             return "#D5DF3E";
                           else
                             return "#F8991D";
                       })
                 .on("mouseover", nodeMouseover)
                 .on("mouseout", mouseout)
                 .on("click", triggerNodeDetailsView)
                .attr("r", function(d){
                     if(d.linknum > 4){
                         return Math.log(d.linknum)*3;
                     }
                     return Math.log(4)*3;
                 })
                .call(force.drag);

            var text = svg.append("svg:g").selectAll("g")
                .data(force.nodes())
            .enter().append("svg:g");

            // A copy of the text with a thick white stroke for legibility.
            text.append("svg:text")
                .attr("x", 10)
                .attr("y", ".31em")
                .attr("class", "shadow")
                .text(function(d) { return d.name; });

            text.append("svg:text")
                .attr("x", 10)
                 .attr("y", ".31em")
                .text(function(d) { return d.name; });

            function tick() {


                line.attr("x1", function(d) { return d.source.x; })
                                .attr("y1", function(d){ return d.source.y; })
                                .attr("x2", function(d){ return d.target.x; })
                                .attr("y2", function(d) { return d.target.y; });

                circle.attr("cx", function(d) { return d.x = Math.max(14, Math.min(width - 14, d.x)); })
                       .attr("cy", function(d) { return d.y = Math.max(14, Math.min(height - 14, d.y)); });

                text.attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
            }


      // Highlight the link and connected nodes on mouseover.
      function linkMouseover(d) {
        svg.selectAll(".link").classed("active", function(p) { return p === d; });
        svg.selectAll(".node circle").classed("active", function(p) { return p === d.source || p === d.target; });
      //  info.text(d.source.name + " → " + d.target.name);
      }

      // Highlight the node and connected links on mouseover.
      function nodeMouseover(d) {
        svg.selectAll(".link").classed("active", function(p) { return p.source === d || p.target === d; });
        d3.select(this).classed("active", true);
    //    info.text(d.name);
      }

      // Clear any highlighted nodes or links.
      function mouseout() {
        svg.selectAll(".active").classed("active", false);
     //   info.text(defaultInfo);
      }

      function triggerNodeDetailsView(item){
         that.showNodeDetails(item.name);
      }

      function triggerEdgeDetailsView(item){
          that.showEdgeDetails({source: item.source.name, target: item.target.name});
      }

            force.start();
                   for(var i=0; i<5000; ++i) force.tick();
                   force.stop();
                   for(var j=0; j< force.nodes().length; j++){
                       force.nodes()[j].fixed=true;
                   }

        return this;
     },

   showNodeDetails: function(node){
       this.nodeDetails = new NodeDetailsModel(this.model.networkData,node);
       var that=this;
       $("#pubcrawlGraphTabs").tabs("option","selected",1);
       var datatable=this.nodeDetails.fetch({success: function(model,response){
           $("#pubcrawlNodeDetails").html(new NodeTableView({model: model}).render().el);
           that.$("#pubcrawlGraphTabs").tabs("option","selected",1);

       }});
   },

    showEdgeDetails: function(edge){
          this.edgeDetails = new EdgeDetailsModel(this.model.networkData,edge);
          var that=this;
          $("#pubcrawlGraphTabs").tabs("option","selected",2);
          var datatable=this.edgeDetails.fetch({success: function(model,response){
              $("#pubcrawlEdgeDetails").html(new EdgeTableView({model: model}).render().el);

          }});
      }

});
