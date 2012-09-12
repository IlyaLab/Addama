exports.config =
  # See docs at http://brunch.readthedocs.org/en/latest/config.html.
  paths:
    public: '_public'
  files:
    javascripts:
      defaultExtension: 'js'
      joinTo:
        'js/app.js': /^app/
        'js/vendor.js': /^vendor/
      order:
        before: [
	        'vendor/js/console-helper.js',
          'vendor/js/jquery-1.8.0.js',
          'vendor/scripts/bootstrap.js',
          'vendor/js/underscore-1.3.3.js',
          'vendor/js/backbone-0.9.2.js',
          'vendor/scripts/backbone-mediator.js'
        ],
        after: [
          'vendor/scripts/bootstrap/bootstrap-transition.js',
          'vendor/scripts/bootstrap/bootstrap-alert.js',
          'vendor/scripts/bootstrap/bootstrap-button.js',
          'vendor/scripts/bootstrap/bootstrap-carousel.js',
          'vendor/scripts/bootstrap/bootstrap-collapse.js',
          'vendor/scripts/bootstrap/bootstrap-dropdown.js',
          'vendor/scripts/bootstrap/bootstrap-modal.js',
          'vendor/scripts/bootstrap/bootstrap-tooltip.js',
          'vendor/scripts/bootstrap/bootstrap-popover.js',
          'vendor/scripts/bootstrap/bootstrap-scrollspy.js',
          'vendor/scripts/bootstrap/bootstrap-tab.js',
          'vendor/scripts/bootstrap/bootstrap-typeahed.js'
        ]
   
    stylesheets:
      defaultExtension: 'less'
      joinTo: 'css/app.css'
      order:
       before: ['vendor/css/bootstrap/bootstrap.less']

    templates:
      defaultExtension: 'hbs'
      joinTo: 'js/app.js'

  # minify: true
