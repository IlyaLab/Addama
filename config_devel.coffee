exports.config =
  # See docs at http://brunch.readthedocs.org/en/latest/config.html.
  paths:
    public: '_public'
  files:
    javascripts:
      defaultExtension: 'js'
      joinTo:
        'js/app.js': /^app/
        'js/jquery.js': /^vendor\/js\/jquery/
        'js/bootstrap.js': /^vendor\/js\/bootstrap\.js/
        'js/underscore.js': /^vendor\/js\/underscore/
        'js/backbone.js': /^vendor\/js\/backbone/
        'js/d3.js': /^vendor\/js\/d3/
        'js/vivagraph.js': /^vendor\/js\/viva/
        'js/vendor.js': /^vendor(\/|\\)(?!js)/

    stylesheets:
      defaultExtension: 'less'
      joinTo: 'css/app.css'
      order:
       before: ['vendor/css/bootstrap/bootstrap.less']

    templates:
      defaultExtension: 'hbs'
      joinTo: 'js/app.js'

  # minify: true`