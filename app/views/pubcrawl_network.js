

module.exports = Backbone.View.extend({

    initialize:function (options) {
        _.extend(this, options);
        _.bindAll(this, "loadData");

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

        var svg = d3.select(this.el).append("svg:svg")
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
          $(that.el).trigger('nodeClicked',item.name);
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
     }

});
