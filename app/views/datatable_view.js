/*
        *dataTables related configuration
         */
        $.extend( $.fn.dataTableExt.oStdClasses, {
            "sWrapper": "dataTables_wrapper form-inline"
        } );

        $.fn.dataTableExt.afnSortData['dom-checkbox'] = function  ( oSettings, iColumn )
        {
        	var aData = [];
        	$( 'td:eq('+iColumn+') input', oSettings.oApi._fnGetTrNodes(oSettings) ).each( function () {
        		aData.push( this.checked==true ? "1" : "0" );
        	} );
        	return aData;
        }

module.exports = Backbone.View.extend({

    initialize: function(config){
        //model contains the data for the table
        this.dataConfig = config.dataConfig; //contains the header data for the table['Name','Aliases','Term Single Count','Term Combo Count','NMD']
        this.checkbox=config.checkbox;   //true if the first column should be a checkbox selection
        this.tableId = config.tableId; //id of the table
        this.expandedConfig = config.expandedConfig //contains the data config for any data that should show up in row details

    },


    render: function(){

        var thisView = this;

        if(this.model == null){
                               return this;
        }
        //now make data table for modal window
        var table='';


        if(this.checkbox){
            table='<table class="table table-striped table-bordered"  id="' + this.tableId + '">'+
                '</table>';
        }
        else{
            table ='<table class="table nocheckbox_table table-striped table-bordered"   id="' + this.tableId + '">'+
                '</table>';
        }

        this.$el.html(table);
        var aoColumns = [];
        if(this.checkbox){
            aoColumns.push( { "sSortDataType": "dom-checkbox", "sTitle": '<input id="check_all" type="checkbox"/>',
                "sWidth": "5%","sDefaultContent":'<input class="tableCheckbox" type="checkbox" />'});
        }
        if(this.expandedConfig != null && this.expandedConfig.length > 0){
            aoColumns.push( {"mDataProp": null,
                "sWidth":"5%",
                               "sClass": "control center",
                                "sDefaultContent": '<img src="../img/details_open.png">'});
        }
        for(var k=0; k < thisView.dataConfig.length; k++){
            var dataProp=thisView.dataConfig[k].propName;
            if(thisView.dataConfig[k].urlLink != null){
                var link = thisView.dataConfig[k].urlLink;
                aoColumns.push({"sTitle": thisView.dataConfig[k].headerName,"mDataProp": dataProp,
               "sWidth":thisView.dataConfig[k].headerWidth,  "fnRender": function (source){
                          return  "<a href='" + link + source.aData[source.mDataProp] + "' target='_blank'>"+source.aData[source.mDataProp] + "</a>";
                    }});
            }
            else{
            aoColumns.push({"sTitle": thisView.dataConfig[k].headerName,"mDataProp": dataProp,
            "sWidth":thisView.dataConfig[k].headerWidth});
            }
        }

        this.oTable=this.$el.find("#" + this.tableId).dataTable({
            "sDom": "<'row'<'span3'l><'span4'f>r>t<'row'<'span3'i><'span4'p>>",
            "sPaginationType": "bootstrap",
            "bAutoWidth":false,
            "aaData": this.model,
            "iDisplayLength": 5,
            "oLanguage": {
                "sLengthMenu": "<select><option value='5'>5</option>" +
                    "<option value='10'>10</option>" +
                    "<option value='15'>15</option>" +
                    "<option value='20'>20</option></select> records per page"
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


