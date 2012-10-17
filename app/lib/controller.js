var Model = require('../models/model');
var JSONModel = require("../models/model_json");
var TableModel = require("../models/model_catalog");
var GraphModel = require('../models/graph');
var FeatureListModel = require('../models/featureList');
var MutationsModel = require('../models/mutations');
var GenomicFeatureListModel = require('../models/genomic_featureList');
var FeatureMatrix2Model = require('../models/featureMatrix2');
var FeatureMatrixModel = require('../models/featureMatrix');

var QEDView = require("../views/qed_configuration");
var DataMenuView = require("../views/data_menu");


Controller = {
    loadQED: function() {
        console.log("loadQED");

        var qedConfigModel = new JSONModel({ url: "svc/data/lookups/qed_configuration.json" });
        var featureLabelModel = new TableModel({ url: "svc/data/lookups/feature_labels" });
        var chromInfoModel = new TableModel({ url: "svc/data/lookups/chromosomes" });

        new QEDView({ model: qedConfigModel, featureLabels: featureLabelModel, chromInfo: chromInfoModel });

        _.each([qedConfigModel, featureLabelModel, chromInfoModel], function(m) {
            m.standard_fetch();
        });
    },

    testwindow : {
        view : function() {
            var WinView = require('../views/window_view');
            var winView = new WinView();
            $('#mainDiv').html(winView.render().el);
        }
    },

    grid : {
        view : function() {
            var GridView = require('../views/grid_view');
            var gridView = new GridView();
            $('#mainDiv').html(gridView.render().el);
            gridView.renderGrid();
        }
    },

    app : {
        layout : function() {
            var TopNavBar = require('../views/topbar_view');
            var topnavbar = new TopNavBar();
            $('#navigation-container').append(topnavbar.render().el);

            var dmModel = new TableModel({ url: "svc/data/analysis/feature_matrices/CATALOG" });

            var gridItems = new DataMenuView({ "data_prefix": "#feature_matrices", "data_suffix": "grid", "model": dmModel });
            var heatItems = new DataMenuView({ "data_prefix": "#feature_matrices", "data_suffix": "heat", "model": dmModel });

            $(".open-in-grid").html(gridItems.render().el);
            $(".open-in-heat").html(heatItems.render().el);

            dmModel.standard_fetch();
        }
    },

    graph : {
        view : function() {
            var GraphView = require('../views/graph_view');
            var graphView = new GraphView();
            $('#mainDiv').html(graphView.render().el);
        }
    },

    pwpv :  {
        view : function() {
            var PwPvView = require('../views/pwpv_view');
            var pwpvView = new PwPvView();
            $('#mainDiv').html(pwpvView.render().el);
            pwpvView.renderGraph();
        }
    },

    twod : {
        view : function(label1, label2) {
            var TwoD = require('../views/2D_Distribution_view');
            var FL = require('../models/featureList');
            var fl = new FL({
                websvc: '/endpoints/filter_by_id?filepath=%2Ffeature_matrices%2F2012_09_18_0835__cons&IDs=',
                feature_list : [label1, label2]
            });
            var twoDView = new TwoD({collection: fl});
            fl.fetch();
            $('#mainDiv').html(twoDView.render().el);
        }
    },

    oncovis : {
        view : function() {
            var Oncovis = require('../views/oncovis_view');
            var oncovisView = new Oncovis();
            $('#mainDiv').html(oncovisView.render().el);
        }
    },

    home : {
        view : function() {
            var HomeView = require('../views/home_view');
            var homeView = new HomeView();
            $('#mainDiv').html(homeView.render().el);
        }
    },

    route_analysis: function(analysis_type, dataset_id, remainder) {

        var arg_array = remainder.length ? remainder.split('/') : [],
            len = arg_array.length,
            features = arg_array.slice(0, len - 1),
            view_name = '';

        if (len > 0) { //if there's param (even an empty one)
            view_name = arg_array[len - 1];
        }

        //graph based analysis
        if (_(['rf-ace','mds','pairwise']).contains(analysis_type)) {
            if (len <= 2) {  // 1 or no parameters.  just draw vis of analysis
                var graphModel = new GraphModel({analysis_id : analysis_type, dataset_id : dataset_id});
                return Controller.ViewModel(view_name || 'graph', graphModel);
            }

            var flModel = new FeatureListModel({analysis_id : analysis_type, dataset_id : dataset_id, features: features});
            return Controller.ViewModel(view_name, flModel);
        }

        if (analysis_type === 'mutations') {
            var mutationsModel = new MutationsModel({analysis_id : analysis_type, dataset_id : dataset_id });
            return Controller.ViewModel(view_name, mutationsModel);
        }

        if (analysis_type === 'information_gain') {
            var glfModel = new GenomicFeatureListModel({analysis_id : analysis_type, dataset_id : dataset_id });
            return Controller.ViewModel(view_name, glfModel);
        }

        //tabular data like /feature_matrices
        if (view_name == 'heat') {
            OncovisDims = require('../models/oncovis_dims');
            oncovisDims = new OncovisDims({dataset_id : dataset_id });
            oncovisDims.standard_fetch();

            var fm2model = new FeatureMatrix2Model({analysis_id : analysis_type, dataset_id : dataset_id, dims: oncovisDims });

            var view = Controller.ViewModel(view_name || 'grid', fm2model);
            var geneListsViews = Controller.GetGeneListViews(view);
            _.each(geneListsViews, function(geneListsView) {
                geneListsView.on("genelist-selected", view.onNewRows);
            });
            return view;
        }

        var fmmodel = new FeatureMatrixModel({analysis_id : analysis_type, dataset_id : dataset_id, features: features});
        return Controller.ViewModel(view_name, fmmodel);
    },

    ViewModel: function(view_name, model) {
        var supported = {
            "graph": "graph_view",
            "grid": "grid_view",
            "circ": "circ_view",
            "heat": "oncovis_view"
        };
        var expected = ["twoD", "kde", "parcoords"];

        if (!_.contains(_.keys(supported), view_name)) {
            console.log("View [" + view_name + "] not supported : expecting one of these [" + _.keys(supported).join(",") + "] :: soon to be supported [" + expected.join(",") + "]");
            return;
        }

        var ViewClass = require('../views/' + supported[view_name]);
        var view = null;
        if (view_name == "circ") {
            var chrModel = new TableModel({ url: "svc/data/lookups/chromosomes" });
            view = new ViewClass({ "model":model, "chrModel": chrModel });
            chrModel.standard_fetch();
        } else {
            view = new ViewClass({model:model});
        }
        $('#mainDiv').html(view.render().el);

        model.fetch({
            success: function(m, resp) {
                var original_model;
                if (Model.prototype.add) {  //is this a Collection?
                    original_model = new Model({analysis_id : model.analysis_type, dataset_id : model.dataset_id});
                    original_model.add(m.toJSON(), {silent:true});
                } else { //nope its a model
                    original_model = new Model(m.toJSON());
                }
                m.original(original_model);
                m.trigger('load');
            }
        });

        return view;
    },

    GetGeneListViews: function(view) {
        var MenuItemView = require("../views/genelist_menuitems");

        var ProfiledModel = require("../models/genelist_profiled");
        var profiledModel = new ProfiledModel();
        profiledModel.standard_fetch();

        var CustomModel = require("../models/genelist_custom");
        var customModel = new CustomModel();
        customModel.standard_fetch();

        var profiledView = new MenuItemView({ model: profiledModel });
        $(".genelist-profiled").html(profiledView.render().el);

        var customView = new MenuItemView({ model: customModel });
        $(".genelist-custom").html(customView.render().el);

        var ManageGLView = require("../views/genelist_manage");
        var manageGLView = new ManageGLView({ model: customModel });
        $('.genelist-modal').html(manageGLView.render().el);

        return [profiledView, customView, manageGLView];
    }
};

module.exports = Controller;

Controller.loadQED();