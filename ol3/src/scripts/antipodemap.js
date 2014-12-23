'use strict';


/*
  Main class constructor
*/
function AntipodeMap(center,opts,maps){
  this.center = center;
  this.opts = opts;
  this.maps = maps;

  this.verbose = maps.opts.verbose != null || false;
  this.divId = opts.div;
  this.highlight = undefined;

  /* ol view */
  this.view = new ol.View({
    center: this.center,
    zoom: this.maps.opts.zoom || 7,
    minZoom: this.maps.opts.minZoom || 4
  });

  /* ol3 map */
  var map = new ol.Map({
    target: this.divId,
    renderer: 'canvas',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.TileJSON({
          url: 'http://api.tiles.mapbox.com/v3/vehrka.k03kl0gg.jsonp',
          crossOrigin: 'anonymous'
        })
      })
    ],
    view: this.view
  });
  map.addControl(new CenterCrossControl());
  this.map = map;
  this.setupMap();


  // First, fill the selectize
  var optionSelector = opts.idprefix + '-search .select-school';
  if ($(optionSelector)[0]){
    this.setupSelectize();
  }
}


AntipodeMap.prototype.setupSelectize = function() {
  var ctx = this;
  var opts = this.opts;

  var optionSelector = opts.idprefix + '-search .select-school';
  var select =  $(optionSelector);


  // Configure the dinamic selector
  select.selectize({
    valueField: opts.properties.id,
    labelField: opts.properties.name,
    searchField: opts.properties.name,
    options:[],
    create: false,
    load:function(query,callback){
      if (!query.length) return callback();
      console.log("load..");
      var sql = 'WITH Q AS (' + opts.cartodb.sql + ') SELECT ' +
          opts.properties.id + ', ' +
          opts.properties.name +
          ' FROM Q WHERE ' + opts.properties.name +
          ' ~~* \'%' + query + '%\' ORDER BY 2 LIMIT 10';
      $.ajax({
        url: 'https://'+ ctx.maps.opts.cartodb.user + '.cartodb.com/api/v2/sql?q=' + encodeURIComponent(sql),
        type: 'GET',
        error: function() {
            msgError("Error retrieving school ids",error,ctx.verbose);
            callback();
        },
        success: function(res) {
            console.log("loaded");
            callback(res.rows);
        }
      }); //ajax
    } // load
  }); // selectize


  // Configure the button
  var button =  $(opts.idprefix + '-search  button');
  button.on('click', function (e) {
      var valueSelected = $(optionSelector + " option:selected").val();
      ctx.moveMapToId(valueSelected);
  });

};

AntipodeMap.prototype.setupMap = function() {
  /* add the cities cartoDB layer */
  var cdbOpts = this.opts.cartodb;
  var user = this.maps.opts.cartodb.user;
  // Config object to send to CartoDB
  var configObj = {
    "version": "1.0.0",
    "stat_tag": "API",
    "layers": [
      {
        "type": "cartodb",
        "options": {
          "sql": cdbOpts.sql,
          "cartocss": cdbOpts.cartocss,
          "cartocss_version": "2.1.0"
        }
      }
  ]}
  // Promise object to load
  var loader = Promise.resolve($.ajax({
    url: 'https://'+ user + '.cartodb.com/api/v1/map?config=' +
      encodeURIComponent(JSON.stringify(configObj)),
    contentType: 'text/plain',
    xhrFields: {
      withCredentials: false
    },
    dataType: "jsonp"
  }));

  var ctx = this;
  loader.then(
    function(response){
      if (ctx.verbose){
        alertify.success(context.opts.cartodb.layer_name  +  " config loaded");
      }
      map.addLayer(new ol.layer.Tile({
          source: new ol.source.XYZ({
            attributions: [
              new ol.Attribution(
                  {html: 'CartoDB &copy; <a href="http:// ' +
                    user + '.cartodb.com/">' + user + '</a>'
                  })
            ],
            url: 'http://{0-3}.' + response.cdn_url.http + '/vehrka/api/v1/map/' + response.layergroupid + '/{z}/{x}/{y}.png'
          })
        }));
    }, function(error){
      msgError("Error loading CartoDB config",error,ctx,verbose);
    }
  );

  var context = this;
  var map = this.map;

  // move to center if feature is clicked
  map.on('click', function(evt) {
      // Move to that coordinates and zoom
      context.moveMap(map.getCoordinateFromPixel(evt.pixel));
  });

  this.setupOverlay();
};


// TODO: move to CartoDB
AntipodeMap.prototype.setupOverlay = function() {

  var map = this.map;
  var nameProp = this.opts.properties.name;

  var styleFunction = function(feature, resolution){
    var fontSize = 14;
    return [new ol.style.Style({
       image: new ol.style.Circle({
        radius: resolution < 300 ? 10 : 6 ,
        fill: new ol.style.Fill({color: 'rgba(164, 0, 0, 1)'}),
        stroke: new ol.style.Stroke({
            color: 'rgba(255, 255, 255, 1)',
            width: resolution < 300 ? 2 : 0 })
      }),
      text: new ol.style.Text({
          font: 'bold ' + fontSize + 'px helvetica, sans-serif',
          text: feature.get(nameProp),
          offsetY: fontSize * -1,
          fill: new ol.style.Fill({
              color: '#204a87'
          }),
          stroke: new ol.style.Stroke({
              color: '#fff',
              width: 4
          })
      })
    })];
  };

  this.featureOverlay = new ol.FeatureOverlay({
    map: map,
    style: styleFunction
  });

};


// TODO: move to CartoDB
AntipodeMap.prototype.displayClosestCity = function(row) {
  var obj = row.properties;
  obj['geometry'] = new ol.geom.Point(
    ol.proj.transform(row.geometry.coordinates, 'EPSG:4326', 'EPSG:3857')
    );

  var feature = new ol.Feature(obj)

  var highlight = this.highlight;

  if (feature !== highlight) {
    if (highlight) {
      this.featureOverlay.removeFeature(highlight);
    }
    if (feature) {
      this.featureOverlay.addFeature(feature);
    }
  }
  this.highlight = feature;
};




/* just access to the map view */
AntipodeMap.prototype.getView = function(){
  return this.view;
};


/* just access to the map view in geographical*/
AntipodeMap.prototype.getViewGeoPoint = function(){
  return ol.proj.transform(this.getView().getCenter(),'EPSG:3857','EPSG:4326');
};


/* function to compute the antipodes of a 3857 coordinate */
AntipodeMap.prototype.antipode = function(center){
  var clt = ol.proj.transform(center, 'EPSG:3857', 'EPSG:4326');
  var lon = clt[0] > 0 ? clt[0] - 180 : clt[0] + 180;
  var lat = clt[1] * -1;
  return ol.proj.transform([lon,lat], 'EPSG:4326', 'EPSG:3857');
};


AntipodeMap.prototype.moveMap = function(coord){
  var pan = ol.animation.pan({
    duration: 1000,
    //easing: elastic,
    source: (this.getView().getCenter())
  });
  this.map.beforeRender(pan);

  if (this.map.getView().getZoom()<10){
    this.map.getView().setZoom(10);
  }

  this.map.getView().setCenter(coord);
}

AntipodeMap.prototype.moveMapToId = function(id) {
  var ctx = this;
  var opts = this.opts;
  var sql = 'WITH Q AS (' + opts.cartodb.sql + ') SELECT ' +
    opts.properties.lat + ' AS lat, ' +
    opts.properties.lon + ' AS lon ' +
    ' FROM Q WHERE ' + opts.properties.id  +
    '~\'' + id + '\'';

  this.maps.sqlLoader(sql).then(
    function(response){
      if (response.rows[0]){
        var lonlat = response.rows[0];
        var coords = ol.proj.transform([lonlat.lon,lonlat.lat], 'EPSG:4326', 'EPSG:3857');
        ctx.moveMap(coords);
      }
    },function(error){
      msgError("Error retrieving school coords",error,ctx.verbose);
    }
  ); //then
};

AntipodeMap.prototype.displayLabel = function(feature,featureOverlay) {
  var labeled = this.labeled;
  if (feature !== labeled) {
    if (labeled) {
      featureOverlay.removeFeature(labeled);
    }
    if (feature) {
      featureOverlay.addFeature(feature);
    }
  }
  this.labeled = feature;
};




/* return a binded antipodes map */
AntipodeMap.prototype.getAntipode = function(divId) {
  var center = this.antipode(this.getView().getCenter());
  var antipodemap = new AntipodeMap(center,divId,this.maps);

  /* bind the instance map view to an external view, using
  the antipode method to sync those views using it*/
  var leftView = this.getView();
  var rightView = antipodemap.getView();
  var antipode = AntipodeMap.prototype.antipode;

  leftView.bindTo('resolution', rightView);
  leftView.bindTo('rotation', rightView);

  var accessor = leftView.bindTo('center', rightView);
  accessor.transform(
      function(center) {
        if (center){
          return antipode(center);
        }
      },
      function(center) {
        if (center){
          return antipode(center);
        }
      }
  );

  return antipodemap;
};
