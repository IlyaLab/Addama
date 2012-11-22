var NodeQuery = Backbone.Model.extend({
        url: function(){
              return this.get("data_uri") + "/graphs/pubcrawl/nodes/query" + "?nodeSet=[{name:'" + this.attributes.searchTerm + "'}]&relationshipSet=[{name:'ngd'}]";
        },

        defaults:{
            searchTerm: "",
            plotData: [],
            tableData: []
        },

        parse: function(response){
            //need to retrieve the nodes from the query
            if(response.data != null && response.data.edges != null){
                var pd=[];
                var td={};
                var tdFinal=[];
                var nodeMap={};
                var qv = this.get("searchTerm").toLowerCase();

                for(var i in response.data.nodes){
                    var node= response.data.nodes[i];
                    nodeMap[node.id]=node.name;
                    if(node.name.toLowerCase() != qv){ //don't want to include query nodes
                        td[node.id]={"name":node.name,"alias":node.aliases,"termcount":node.termcount,"termcount_alias":node.termcount_alias,"nodeType": node.nodeType};
                    }else{
                        //put query item into this model for retrieval later
                        this.searchData={"name":node.name,"alias":node.aliases,"termcount":node.termcount,"termcount_alias":node.termcount_alias,"nodeType": node.nodeType};
                    }
                }
                for(var e in response.data.edges){
                    var edge = response.data.edges[e];
                    if(nodeMap[edge.source].toLowerCase() == qv){
                        //then do target (source should always be query value, but being cautious and not assuming that
                        //to be the case
                        if(nodeMap[edge.target].toLowerCase() == qv){
                            //this is the ngd value of the node to itself, just continue
                            continue;
                        }
                        else{
                            var nodeInfo = td[edge.target];
                            var nmd = Math.round(edge.ngd * 100)/100;
                            nodeInfo.nmd = nmd;
                            nodeInfo.combocount = edge.combocount;
                            td[edge.target]=nodeInfo;

                        }
                    }
                    else{ //didn't equal query value, make sure the target does
                        if(nodeMap[edge.target].toLowerCase() == qv){
                             var nodeInfo = td[edge.source];
                            var nmd = Math.round(edge.ngd * 100)/100;
                            nodeInfo.nmd = nmd;
                            nodeInfo.combocount = edge.combocount;
                            td[edge.source]=nodeInfo;

                        }
                        else{        //this edge does not include our queryValue, so don't put into data table
                            continue;
                        }

                    }
                }

                for(item in td){
                    tdFinal.push(td[item]);
                    pd.push(td[item].nmd);
                }

                this.plotData=pd;
                this.tableData = tdFinal;
                return;
            }
            return;
        }

});
var Edge = Backbone.Model.extend({
    initialize: function(attributes){
        for(var key in attributes){
            this[key] = attributes[key];
        }
    }
});

var EdgeCollection = Backbone.Collection.extend({
    model:Edge
});

var Node = Backbone.Model.extend({
    initialize: function(attributes){
        for(var key in attributes){
            this[key] = attributes[key];
        }
    }
});

var NodeCollection = Backbone.Collection.extend({
    model: Node
});

var NetworkModel = Backbone.Model.extend({
         url: function(){
               return this.get("data_uri") + "/graphs/pubcrawl/relationships/query" + "?nodeSet=" + this.createNodeUrlString() + "&relationshipSet=[{name:'ngd'},{name:'domine'}]";
         },

         initialize: function(data){
             this.nodes=data.nodes;
             this.searchterm = data.searchterm;
         },
         createNodeUrlString: function(){
             var nodeSetString = "[";

             for(var i=0; i< this.nodes.length; i++){
                 nodeSetString = nodeSetString + "{name:'" + this.nodes[i].name + "'},";
             }
             nodeSetString = nodeSetString.substring(0,nodeSetString.length-1) + "]";
             return nodeSetString;
         },

         parse: function(response){
             //need to retrieve the edges
             this.edges=new EdgeCollection();
             this.nodes=new NodeCollection();
             var nodeIdMappings={};
             var tempEdges=[];
             if(response.data != null && response.data.edges != null){
                 for(var i=0; i < response.data.nodes.length; i++){
                     var node={linknum: 0, id: response.data.nodes[i].id, index: i, name: response.data.nodes[i].name, tf: response.data.nodes[i].tf, termcount: response.data.nodes[i].termcount, nodeType: response.data.nodes[i].nodeType};
                     if(node.name == this.searchterm){
                         node.nmd=0;
                         node.cc = response.data.nodes[i].termcount;
                     }
                          nodeIdMappings[response.data.nodes[i].id] = node;
                 }
                     for(var index=0; index < response.data.edges.length; index++){
                         var edge = response.data.edges[index];
                         var nmd;
                         //if this edge is from our searchterm to a target, then get the nmd value and put it into the node object
                         if(nodeIdMappings[edge.source].name == this.searchterm && edge.ngd != null){
                             nodeIdMappings[edge.target].nmd = edge.ngd;
                             nodeIdMappings[edge.target].cc = edge.combocount;
                         }
                         else if( nodeIdMappings[edge.target].name == this.searchterm && edge.ngd != null){
                             nodeIdMappings[edge.source].nmd = edge.ngd;
                             nodeIdMappings[edge.source].cc = edge.combocount;
                         }

                         nodeIdMappings[edge.source].linknum++;
                         nodeIdMappings[edge.target].linknum++;

                         //do this for now, but should change underlying service...
                         edge.nmd =edge.ngd;
                         edge.cc=edge.combocount;
                         tempEdges.push(edge);
                     }

                 for(var key in nodeIdMappings){
                      this.nodes.add(nodeIdMappings[key]);
                 }

                 //now have edges and nodes collections, but now need to map the node models onto the edge target and source
                 nodeIDMappings={};
                 var nodeMap={};
                 for( var item in this.nodes.models){
                     nodeMap[this.nodes.models[item].id]=this.nodes.models[item];
                 }
                 for(var i=0; i< tempEdges.length; i++){
                     var item = tempEdges[i];
                     item.source = nodeMap[item.source];
                     item.target = nodeMap[item.target];
                     this.edges.add(item);
                 }

             }

             return;
         }
});

module.exports = Backbone.Model.extend({

    initialize: function (options) {
        _.extend(this, options);
    },

    fetch: function (options) {
        _.extend(this, options);

        var nodeQuery = new NodeQuery({data_uri: this.get("data_uri"),searchTerm: this.genes[0].toLowerCase()});
                that = this;
                nodeQuery.fetch({
                    success: function(model, response){
                        model.tableData.sort(function(a,b){
                            return d3.ascending(a.nmd,b.nmd);
                        });
                        var i=0;
                        that.selectedNodes = model.tableData.filter(function(){
                                if(i < 30){
                                    i++;
                                    return true;
                                }
                            else
                                return false;
                        });
                        that.selectedNodes.push(model.searchData);
                        that.networkData = new NetworkModel({data_uri: that.get("data_uri"),nodes: that.selectedNodes, searchterm: that.searchTerm});
                        that.networkData.fetch({success: function(model,response) {
                            options.success(model,response);
                        }});
                    }
                });

    }

});

