var Template = require('../views/templates/pubcrawl');
var NodeTabTemplate = require('../views/templates/nodeTabTable');
var TableView = Backbone.View.extend({

    initialize: function(config){
        //model contains the data for the table
        this.dataConfig = config.dataConfig; //contains the header data for the table['Name','Aliases','Term Single Count','Term Combo Count','NMD']
        this.checkbox=config.checkbox;   //true if the first column should be a checkbox selection
        this.tableId = config.tableId; //id of the table
        this.expandedConfig = config.expandedConfig //contains the data config for any data that should show up in row details

    },

    render: function(){

        var thisView = this;


        //now make data table for modal window
        var table='';


        if(this.checkbox){
            table='<table class="table table-striped table-bordered" width="500"  id="' + this.tableId + '">'+
                '</table>';
        }
        else{
            table ='<table class="table nocheckbox_table table-striped table-bordered" width="500"  id="' + this.tableId + '">'+
                '</table>';
        }

        this.$el.html(table);
        var aoColumns = [];
        if(this.checkbox){
            aoColumns.push( { "sSortDataType": "dom-checkbox", "sTitle": '<input id="check_all" type="checkbox"/>',
                "sWidth": "10px","sDefaultContent":'<input class="tableCheckbox" type="checkbox" />'});
        }
        if(this.expandedConfig != null && this.expandedConfig.length > 0){
            aoColumns.push( {"mDataProp": null,
                "sWidth":"10px",
                               "sClass": "control center",
                                "sDefaultContent": '<img src="../img/details_open.png">'});
        }
        for(var k=0; k < thisView.dataConfig.length; k++){
            var dataProp=thisView.dataConfig[k].propName;
            if(thisView.dataConfig[k].urlLink != null){
                   dataProp="<a href='" + thisView.dataConfig[k].urlLink + dataProp + "' target='_blank'>"+dataProp + "</a>";
            }
            aoColumns.push({"sTitle": thisView.dataConfig[k].headerName,"mDataProp": dataProp,
            "sWidth":thisView.dataConfig[k].headerWidth,"sDefaultContent": ""});
        }

        this.oTable=this.$el.find("#" + this.tableId).dataTable({
            "sDom": "<'row'<'span3'l><'span4'f>r>t<'row'<'span3'i><'span4'p>>",
            "sPaginationType": "bootstrap",
            "bAutoWidth":false,
            "aaData": this.model,
            "oLanguage": {
                "sLengthMenu": "_MENU_ records per page"
            },

            "aoColumns":aoColumns,

            "fnInitComplete"  : function () {
                var that=this;
                this.fnAdjustColumnSizing(true);
                if(thisView.checkbox){
                thisView.$el.find('#check_all').click( function() {
                    $('input', that.fnGetNodes()).attr('checked',this.checked);
                    thisView.$el.trigger("tableSelectionChange");
                } );
                this.$('.tableCheckbox').click(function(){
                    thisView.$el.trigger("tableSelectionChange");
                });
                }
                else{
                    this.$('tbody tr').click(function(item){

                    });
                }

            }
        });

        thisView.anOpen=[];
        if(thisView.expandedConfig != null && thisView.expandedConfig.length > 0){
            $("#" + this.tableId + " td.control").live('click', function(){
                var nTr = this.parentNode;
                var i = $.inArray(nTr,thisView.anOpen);

                if(i == -1){  //this item was not in the open list, open it
                    $('img', this).attr('src',"../img/details_close.png" );
                    thisView.oTable.fnOpen(nTr, thisView.formatDetails(thisView.oTable, nTr), 'details');
                    thisView.anOpen.push(nTr);
                }
                else{
                    $('img',this).attr('src',"../img/details_open.png" );
                    thisView.oTable.fnClose(nTr);
                    thisView.anOpen.splice(i,1);
                }
            });
        }

        return this;
    },



    formatDetails: function(oTable, row){
         var data = oTable.fnGetData(row);
        var sOut = '<div class="innerDetails">'+
            '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
        for(var k=0; k< this.expandedConfig.length; k++){
            sOut+='<tr><td>' + data[this.expandedConfig[k].propName] + '</td></tr>';
        }
        sOut+='</table></div>';
        return sOut;
    }

});

var NodeTabTableView = Backbone.View.extend({

    initialize: function(){

        this.$el.html(NodeTabTemplate({}));
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

        this.$el.find("#nodeDetailsModalBody").html(tabs);

        var docConfig = [{headerName:'PMID', headerWidth: '10%', propName:'pmid', urlLink:'http://www.ncbi.nlm.nih.gov/pubmed/'},
            {headerName:'Title', headerWidth: '50%', propName: 'article_title'},
            {headerName:'Pub. Year', headerWidth: '10%', propName: 'pub_date_year'}];

        var expConfig = [{propName:'abstract_text'}];

        this.docView = new TableView({dataConfig: docConfig, expandedConfig: expConfig, checkbox: false, tableId: "docTable",model: this.model.docs});
        this.$el.find("#docTableView").html(this.docView.render().el);

        var nmdConfig = [{headerName:'Name', headerWidth: '30%', propName:'name'},
            {headerName:'Term Single Count', headerWidth: '10%', propName: 'termcount'},
            {headerName:'Term Combo Count', headerWidth: '10%', propName: 'combocount'},
            {headerName:'NMD', headerWidth: '10%', propName: 'nmd'}];

        this.nmdView = new TableView({dataConfig: nmdConfig, checkbox: false, tableId: "nmdTable",model: this.model.nmdDetailsModel});
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

        this.domineView = new TableView({dataConfig: dataConfig, checkbox: false, tableId: "domineTable",model: this.model.domineDetailsModel});
        this.$el.find("#domineTableView").html(this.domineView.render().el);

        return this;
    }
});
module.exports = Backbone.View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "loadData");

        this.$el.html(Template({}));

        this.model.on("load", this.loadData);
    },

    loadData: function() {

      this.render(600,400);

    },


    render: function(width,height){

            var width = width,
                height = height,
                that=this;

        if(this.model == null || this.model.networkData == null){
                        return this;
                    }

        var svg = d3.select(this.$el.find("#pubcrawl-network-container").context).append("svg:svg")
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
                            return (d.nmd)*300;
                        }
                        return 300;
                    })
                .charge(-200)
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
          $(that.el).trigger('edgeClicked',{source: item.source.name, target: item.target.name});
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
       var datatable=this.nodeDetails.fetch({success: function(model,response){
           $("#pubcrawl-table-container").html(new NodeTabTableView({model: model}).render().el);
       }});
   }

});
