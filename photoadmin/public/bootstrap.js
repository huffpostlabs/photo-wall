(function(root, $) {

  var PW = root.LabsPhotoWall = (root.LabsPhotoWall || {});
  PW.version = 3;
  PW.selector = ".photowall-container";
  PW.staticUrl = "https://photo-wall-static.s3.amazonaws.com/";

  /*
   * If we pass {local: true} to the bootstrap function, or if there's a meta
   * tag called "photo-wall-static" with content "local" then this function will
   * return a path to this server. Else, will return a path to s3 using the default
   * version.
   */
  PW.versionedUrl = function(resource) {
    if (PW.local) return "/"+resource;

    var base = PW.staticUrl + "v" + PW.version + "/";
    if (resource !== undefined) return base + resource;
    else return base;
  }

  /*
   * Searches the document for elements matching the passed css selector,
   * then adds it to the list of walls for the page.
   *
   * Tags each element with an id equal to the name of the json file, for
   * later reference.
   */
  var searchSeeds = function(selector) {
    var $seeds = $(selector);
    var walls = [];
    $seeds.each(function() {
      var $seed = $(this);
      var layout = $seed.data('layout');
      var id = layout.substring(layout.lastIndexOf('/')+1).split('.json')[0];
      $seed.attr('id', id);
      $seed.append('<div class="spinner">');
      walls.push({
        id: id,
        element: $seed,
        layout: layout
      });
    });
    return walls;
  }

  /*
   * Called at the bottom of this file.
   * Sets options like the version number, the static url, and whether or not to use
   * the local server for assets. Also loads css, the rest of the photo viewer, and
   * kicks off the viewer populating the grids.
   */
  PW.bootstrap = function(options) {
    if (options) {
      if (options.local) PW.local = true;
      if (options.selector) PW.selector = options.selector;
      if (options.version) PW.version = options.version;
      if (options.staticUrl) PW.staticUrl = options.staticURL;
    }
    if ($('meta[name=photo-wall-static]').attr('content') === "local") PW.local = true;

    loadDependencies();
    PW.walls = searchSeeds(PW.selector);
    $.ajax({
      url: PW.versionedUrl("photowall.js"),
      dataType: 'script',
      cache: true,
      success: initialize
    });
  }

  var dependenciesLoaded = function() {
    if (window.Handlebars === undefined) {
      return false;
    }
    if (PW.loaded != true) {
      return false;
    }
    return true;
  }

  /*
   * For each wall, fetches the json and calls the viewer's build method.
   */
  var initialize = function() {
    if (dependenciesLoaded()) {
      var i = 0;
      for (i; i < PW.walls.length; i++) {
        (function() {
          var wall = PW.walls[i];
          console.log("Fetching wall from "+wall.layout);
          $.getJSON(wall.layout, function(layout) {
            var $ss = $('#'+wall.id);
            PW.build($ss, layout);
          });
        })();
      }
    }
  }

  var loadDependencies = function() {
    // assume that the page loads jQuery anyway
    $('<link rel="stylesheet" type="text/css">')
      .attr('href', PW.versionedUrl('photowall.css'))
      .appendTo('head');

    $('<link rel="stylesheet" type="text/css">')
      .attr('href', PW.versionedUrl('responsive.css'))
      .appendTo('head');

    if (window.Handlebars === undefined) {
      $.ajax({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.3.0/handlebars.min.js',
        dataType: 'script',
        cache: true,
        success: initialize
      });
    }
  }

}(this, jQuery));

jQuery(document).ready(function() {
  LabsPhotoWall.bootstrap()
});
