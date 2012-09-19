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
        ]
   
    stylesheets:
      defaultExtension: 'less'
      joinTo: 'css/app.css'

    templates:
      defaultExtension: 'hbs'
      joinTo: 'js/app.js'

  # minify: true
