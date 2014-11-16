'use strict';


/*
  Main class constructor
*/
function AntipodeMap(center,opts,maps){
  this.opts = opts;
  this.divId = opts.div;
  this.highlight = undefined;
  this.maps = maps;

  /* ol view */
  this.view = new ol.View({
    center: center,
    zoom: maps.opts.zoom || 7,
    minZoom: maps.opts.minZoom || 4
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

  /* add the cities cartoDB layer */
  if (this.opts.cartoLayer){
    var cdbOpts = this.opts.cartoLayer;
    var user = this.maps.opts.cartoUser;
    // Config object to send to CartoDB
    var configObj = {
      "version": "1.0.0",
      "stat_tag": "API",
      "layers": [
        {
          "type": "cartodb",
          "options": {
            "sql": 'select * from ' + cdbOpts.table,
            "cartocss": cdbOpts.css,
            "cartocss_version": "2.1.0"
          }
        }
      ]
    };

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

    loader.then(
      function(response){
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
        if (console && console.error){
          console.error(error);
        }
      }
    );
  }

  var context = this;
  // move to center if feature is clicked
  map.on('click', function(evt) {
      // Move to that coordinates and zoom
      context.moveMap(map.getCoordinateFromPixel(evt.pixel));
  });


  this.map = map;
  this.setupOverlay();
}




// TODO: move to CartoDB
AntipodeMap.prototype.setupOverlay = function() {

  var layer = this.pointsLayer;
  var context = this;
  var map = this.map;
  var mapOpts = this.maps.opts;
  var nameProp = this.opts.nameProp;

  var styleFunction = function(feature, resolution){
    var fontSize = 14;
    return [new ol.style.Style({
       image: new ol.style.Circle({
        radius: resolution < 300 ? 12 : 4 ,
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

  var featureOverlay = new ol.FeatureOverlay({
    map: map,
    style: styleFunction
  });

};


// TODO: move to CartoDB
AntipodeMap.prototype.displayClosestCity = function(center,featureOverlay) {
/*  var highlight = this.highlight;

  var feature = source.getClosestFeatureToCoordinate(center);
  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.addFeature(feature);
    }
  }
  this.highlight = feature;
  if (feature){
    this.maps.features[this.divId] = feature;
    this.maps.updateDist();
  }*/
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
  this.map.getView().setZoom(10);
  this.map.getView().setCenter(coord);
}

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
