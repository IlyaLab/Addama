var View = require('./view');
var template = require('./templates/grid');
var FeatureMatrix = require('../models/featureMatrix');

module.exports = View.extend({

  collection:FeatureMatrix,
  template:template,

  initialize : function() {
  	_.bindAll(this, 'getRenderData', 'afterRender', 'renderGrid');
  },
  
  getRenderData : function() {},

  afterRender: function() {
  	var _this = this;
    this.$el.addClass('row-fluid');
    this.collection.bind('load',_this.renderGrid);
  },

  renderGrid : function(){
	  var container = this.$el.find(".grid-container");
		var grid,
		    columns = [],
		    rows = this.collection.toJSON();

    var ignore_columns = ['feature_id'];

    var temp_cols = _.difference(this.collection.getHeaders(),(ignore_columns));

    temp_cols.splice(0, 0, temp_cols.splice(temp_cols.indexOf('label'), 1)[0]);  //move 'label' field to the front         

    var width = function(idx) { return idx === 0 ? 320 : 60; }
    _.each(temp_cols, function(i,idx) {
			columns.push({id: i, name: i, field: i, width: width(idx), sortable: true, selectable: true});
		});

	    var checkboxSelector = new Slick.CheckboxSelectColumn({
	      cssClass: "slick-cell-checkboxsel"
	    });

	    columns.unshift(checkboxSelector.getColumnDefinition());

		var options = {
			enableCellNavigation: false,
			enableColumnReorder: false
		};

		grid = new Slick.Grid(container, rows, columns, options);
		grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: true}));
		grid.registerPlugin(checkboxSelector);
		grid.onSort.subscribe(function(e, args){ // args: sort information. 

        var field = args.sortCol.field;

        rows.sort(function(a, b){
        	var x = a[field],
        	    y = b[field],
        	    result;

        	    if (!(_.isNumber(x) || _.isNumber(y))) {
        	    		result = 
        	    			a[field] > b[field] ? 1 :
			                a[field] < b[field] ? -1 :
			                0
			                ;
        	    } else if (!_.isNumber(x)) {
        	    		result = 1;
        	    } else if (!_.isNumber(y)) {
        	    		result = -1;
        	    } else {
			            result = x-y;
			        }
            return args.sortAsc ? result : -result;
        });

        grid.onSelectedRangesChanged(function(rows){});
        
        args.grid.invalidateAllRows();
   		args.grid.render();
    });
	}

});