var Template = require('./templates/pubcrawl_network');

var NodeDetailsModel = Backbone.Model.extend({
    //url for this model is the solr connection to retrieve documents related to this node

    url: function(){
        return this.get("data_uri") + "?qt=distributed_select&sort=pub_date_year desc&wt=json&rows=1000&q=%2Btext%3A%28'" + this.nodeName + "'%29&fq=pub_date_year:[1991 TO 2012]" +
            "&hl.q=abstract_text%3A"+ this.nodeName + " article_title%3A" + this.nodeName;
    },

    initialize: function(data){
        //setup the various model items by finding all edges with the nodeName and putting into the appropriate jsonarray
        this.nodeName = data.nodeName;
        this.nmdDetailsModel = [];
        this.domineDetailsModel = [];
        for(var i=0; i< data.networkModel.nodes.length; i++){
            if(data.networkModel.nodes.models[i].name == data.nodeName){
                this.node = data.networkModel.nodes.models[i];
                break;
            }
        }
        for(var i=0; i< data.networkModel.edges.length; i++){
            var edge = data.networkModel.edges.models[i];
            if(edge.source.name == this.node.name){
                if(edge.relType == "ngd"){

                    var edgeItem={name: edge.target.name, combocount: edge.combocount, termcount: edge.target.termcount,nmd:edge.nmd};
                    this.nmdDetailsModel.push(edgeItem);
                }
                else if(edge.relType == "domine"){
                    var edgeItem={term1: edge.source.name, term2: edge.target.name, pf1: edge.pf1, pf2: edge.pf2,
                        pf1_count: edge.pf1_count, pf2_count: edge.pf2_count, type: edge.type, uni1: edge.uni1, uni2: edge.uni2};
                    this.domineDetailsModel.push(edgeItem);
                }
            }
            else if(edge.target.name == this.node.name){
                //don't need to do ngd here, since it is currently doubled, should be able to also remove domine once it is doubled correctly
                if(edge.relType == "domine"){
                    var edgeItem={term1: edge.target.name, term2: edge.source.name, pf1: edge.pf1, pf2: edge.pf2,
                        pf1_count: edge.pf1_count, pf2_count: edge.pf2_count, type: edge.type, uni1: edge.uni1, uni2: edge.uni2};
                    this.domineDetailsModel.push(edgeItem);
                }
            }
        }

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

var EdgeDetailsModel = Backbone.Model.extend({
    //url for this model is the solr connection to retrieve documents related to this node
    url: function(){
        return this.get("data_uri") + "?qt=distributed_select&sort=pub_date_year desc&wt=json&rows=1000&q=%2Btext%3A%28'" + this.source + "'%29%20%2Btext%3A%28'" + this.target + "'%29&fq=pub_date_year:[1991 TO 2012]" +
            "&hl.q=abstract_text%3A" + this.target + " article_title%3A" + this.target + " abstract_text%3A"+ this.source + " article_title%3A" + this.source;
    },

    initialize: function(data){
        //setup the various model items by finding all edges with the nodeName and putting into the appropriate jsonarray
        this.data_uri=data.data_uri;
        this.source = data.edge.source;
        this.target = data.edge.target;
        this.nmdDetailsModel = [];
        this.domineDetailsModel = [];

        for(var i=0; i< data.networkModel.edges.length; i++){
            var edge = data.networkModel.edges.models[i];
            if(edge.source.name == this.source && edge.target.name == this.target){
                if(edge.nmd != null){

                    var edgeItem={term1: edge.source.name, term2: edge.target.name,combocount: edge.combocount, termcount: edge.target.termcount,nmd:edge.nmd};
                    this.nmdDetailsModel.push(edgeItem);
                }
                else if(edge.relType == "domine"){
                    var edgeItem={term1: edge.source.name, term2: edge.target.name, pf1: edge.pf1, pf2: edge.pf2,
                        pf1_count: edge.pf1_count, pf2_count: edge.pf2_count, type: edge.type, uni1: edge.uni1, uni2: edge.uni2};
                    this.domineDetailsModel.push(edgeItem);
                }
            }
        }

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
        this.docView = new ViewClass({dataConfig: docConfig, expandedConfig: expConfig, checkbox: false, tableId: "nodedocTable",model: this.model.docs});
        this.$el.find("#docTableView").html(this.docView.render().el);

        var nmdConfig = [{headerName:'Name', headerWidth: '30%', propName:'name'},
            {headerName:'Term Single Count', headerWidth: '10%', propName: 'termcount'},
            {headerName:'Term Combo Count', headerWidth: '10%', propName: 'combocount'},
            {headerName:'NMD', headerWidth: '10%', propName: 'nmd'}];

        this.nmdView = new ViewClass({dataConfig: nmdConfig, checkbox: false, tableId: "nodenmdTable",model: this.model.nmdDetailsModel});
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

        this.domineView = new ViewClass({dataConfig: dataConfig, checkbox: false, tableId: "nodedomineTable",model: this.model.domineDetailsModel});
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
            '<li class="active"><a id="edgeDocTab" href="#edocTableView" data-toggle="tab">Medline Documents</a></li>' +
            '<li><a id="edgeNMDTab" href="#enmdTableView" data-toggle="tab">NMD Connections</a></li>' +
            '<li><a id="edgeDomineTab" href="#edomineTableView" data-toggle="tab">Domine Connections</a></li>' +
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
        this.docView = new ViewClass({dataConfig: docConfig, expandedConfig: expConfig, checkbox: false, tableId: "edgedocTable",model: this.model.docs});
        this.$el.find("#edocTableView").html(this.docView.render().el);

        var nmdConfig = [{headerName:'Term1', headerWidth: '20%', propName:'term1'},
            {headerName: 'Term2', headerWidth: '20%', propName: 'term2'},
            {headerName:'Term Single Count', headerWidth: '10%', propName: 'termcount'},
            {headerName:'Term Combo Count', headerWidth: '10%', propName: 'combocount'},
            {headerName:'NMD', headerWidth: '20%', propName: 'nmd'}];

        this.nmdView = new ViewClass({dataConfig: nmdConfig, checkbox: false, tableId: "edgenmdTable",model: this.model.nmdDetailsModel});
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

        this.domineView = new ViewClass({dataConfig: dataConfig, checkbox: false, tableId: "edgedomineTable",model: this.model.domineDetailsModel});
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


       this.nodeDetails = new NodeDetailsModel({data_uri:"svc/" +this.catalog_unit.detailsService,networkModel:this.model.networkData,nodeName:node});
       var that=this;
      $("#pubcrawlGraphTabs").tabs("option","selected",1);
       var datatable=this.nodeDetails.fetch({success: function(model,response){
           if(that.nodeDetailsView){
               that.nodeDetailsView.model=model;
           }
           else{
               that.nodeDetailsView= new NodeTableView({model:model});
           }
           $("#pubcrawlNodeDetails").html(that.nodeDetailsView.render().el);
           that.$("#pubcrawlGraphTabs").tabs("option","selected",1);

       }});
   },

    showEdgeDetails: function(edge){

          this.edgeDetails = new EdgeDetailsModel({data_uri:"svc/" +this.catalog_unit.detailsService,networkModel:this.model.networkData,edge:edge});
          var that=this;
          $("#pubcrawlGraphTabs").tabs("option","selected",2);
          var datatable=this.edgeDetails.fetch({success: function(model,response){
              if(that.edgeDetailsView){
                  that.edgeDetailsView.model=model;
              }
              else{
                  that.edgeDetailsView = new EdgeTableView({model: model});
              }
              $("#pubcrawlEdgeDetails").html(that.edgeDetailsView.render().el);

          }});
      }

});
