'use strict';

/**
 * @param {number} n The max number of characters to keep.
 * @return {string} Truncated string.
 */
String.prototype.trunc = String.prototype.trunc ||
    function(n) {
      return this.length > n ? this.substr(0, n - 1) + '...' : this.substr(0);
    };


/**
 * Custom control to add a cross in the middle of the map
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
function CenterCrossControl(optOptions) {
  var options = optOptions || {};
  var element = document.createElement('div');
  element.className = 'center-cross ol-unselectable';

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

}
ol.inherits(CenterCrossControl, ol.control.Control);


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
  this.map = new ol.Map({
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
  this.map.addControl(new CenterCrossControl());

  /* add the cities vector layer */
  this.pointsLayer = this.getPointsLayer();
  this.map.addLayer(this.pointsLayer);

  this.setupOverlay();
}

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


/* Add a geojson cities layer */
AntipodeMap.prototype.getPointsLayer = function(){
  /* define a styling function to draw a maki marker
    icon and a label with the city name */
  var styleFunction = function(feature,resolution){
    return [new ol.style.Style({
      image: new ol.style.Circle({
        radius: resolution < 150 ? 8 : 2 ,
        fill: new ol.style.Fill({color: 'rgba(100, 100, 100, 1)'}),
        stroke: new ol.style.Stroke({
            color: 'rgba(225, 225, 225, 1)',
            width: resolution < 150 ? 2 : 0 })
      })
    })];
  };




  var pointsLayer = new ol.layer.Vector({
    source: new ol.source.GeoJSON({
      url: this.opts.data,
      projection: 'EPSG:3857'
    }),
    style: styleFunction
  });

  return pointsLayer;
};


AntipodeMap.prototype.displayClosestCity = function(center,source,featureOverlay) {
  var highlight = this.highlight;
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
  }
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

  map.on('moveend',function(){
    var center = this.getView().getCenter();
    if (layer && layer.getSource() && layer.getSource().getFeatures().length>0){
       context.displayClosestCity(center,layer.getSource(),featureOverlay);
    }
  });


  $(map.getViewport()).on('mousemove', function(evt) {
    var pixel = map.getEventPixel(evt.originalEvent);
    var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
      context.displayLabel(feature,featureOverlay);
    });
  });

  // move to center if feature is clicked
  map.on('click', function(evt) {
    var feature = map.forEachFeatureAtPixel(evt.pixel,
        function(feature, layer) {
          return feature;
        });
    if (feature) {
      var geometry = feature.getGeometry();
      var coord = geometry.getCoordinates();

      // Move to that coordinates and zoom
      var elastic = function(t) {
        return Math.pow(2, -13 * t) * Math.sin((t - 0.025) * (2 * Math.PI) / 0.2) + 1;
      }
      var pan = ol.animation.pan({
        duration: 1000,
        //easing: elastic,
        source: (this.getView().getCenter())
      });
      this.beforeRender(pan);
      this.getView().setZoom(10);
      this.getView().setCenter(coord);
    }
  });

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

/* bind two dom elements (jquery selectors) to the view center*/
AntipodeMap.prototype.bindUI = function(opts){
  this.map.on('moveend',function(evt){
    var center3857 = evt.target.getView().getCenter();
    var center = ol.proj.transform(center3857,'EPSG:3857','EPSG:4326');
    $(opts.detailDiv + " .lon").text(center[0].toFixed(4));
    $(opts.detailDiv + " .lat").text(center[1].toFixed(4));
  });
};


/**
 * Class to coordinate work together
 */
function AntipodesMaps(opts) {
  this.opts = opts;
  this.leftMap =  new AntipodeMap(opts.center,opts.left,this);
  this.rightMap = this.leftMap.getAntipode(opts.right);

  this.leftMap.bindUI(opts.left);
  this.rightMap.bindUI(opts.right);

  var features = {};
  features[opts.left.div] =  null;
  features[opts.right.div] = null;

  this.features = features;
}

AntipodesMaps.prototype.updateDist = function() {
  /** Converts numeric degrees to radians */
  if (typeof(Number.prototype.toRad) === 'undefined') {
    Number.prototype.toRad = function() {
      return this * Math.PI / 180;
    };
  }

  var WGS84 = {a : 6378137, b : 6356752.314245, f : 1 / 298.257223563};

  function xyzDist(from,to){
    var cartesian = function(point){
      var lat = point[1], lon = point[0];
      var φ = lat.toRad(), λ = lon.toRad(), H = 0;
      var a = WGS84.a, b = WGS84.b;

      var sinφ = Math.sin(φ), cosφ = Math.cos(φ);
      var sinλ = Math.sin(λ), cosλ = Math.cos(λ);

      var eSq = (a*a - b*b) / (a*a);
      var ν = a / Math.sqrt(1 - eSq*sinφ*sinφ);

      var x = (ν+H) * cosφ * cosλ;
      var y = (ν+H) * cosφ * sinλ;
      var z = ((1-eSq)*ν + H) * sinφ;

      var pointXYZ = {x:x,y:y,z:z};

      return pointXYZ;
    };

    var sqDif = function(a,b){return Math.pow (a - b,2)};

    var fromC = cartesian(from), toC = cartesian(to);

    return Math.sqrt(sqDif(fromC.x,toC.x) + sqDif(fromC.y,toC.y) + sqDif(fromC.z,toC.z))/1000;
  }

  /**
   * Code from http://jsperf.com/vincenty-vs-haversine-distance-calculations
   *
   * Calculates geodetic distance between two points specified by latitude/longitude using
   * Vincenty inverse formula for ellipsoids
   *
   * @param   {Number} lat1, lon1: first point in decimal degrees
   * @param   {Number} lat2, lon2: second point in decimal degrees
   * @returns (Number} distance in metres between points
   */

  function distVincenty(lat1, lon1, lat2, lon2) {
    var a = WGS84.a,
        b = WGS84.b,
        f = WGS84.f; // WGS-84 ellipsoid params
    var L = (lon2 - lon1).toRad();
    var U1 = Math.atan((1 - f) * Math.tan(lat1.toRad()));
    var U2 = Math.atan((1 - f) * Math.tan(lat2.toRad()));
    var sinU1 = Math.sin(U1),
        cosU1 = Math.cos(U1);
    var sinU2 = Math.sin(U2),
        cosU2 = Math.cos(U2);

    var lambda = L,
        lambdaP, iterLimit = 300;
    do {
      var sinLambda = Math.sin(lambda),
          cosLambda = Math.cos(lambda);
      var sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      if (sinSigma == 0) return 0; // co-incident points
      var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      var sigma = Math.atan2(sinSigma, cosSigma);
      var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      var cosSqAlpha = 1 - sinAlpha * sinAlpha;
      var cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
      if (isNaN(cos2SigmaM)) cos2SigmaM = 0; // equatorial line: cosSqAlpha=0 (§6)
      var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - lambdaP) > 1e-9 && --iterLimit > 0);

    if (iterLimit == 0) return NaN // formula failed to converge
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    var s = b * A * (sigma - deltaSigma);

    return s/1000;
  }

  // Distance in kilometers between two points using the Haversine algo.
  function harvesine(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1).toRad();
    var dLong = (lon2 - lon1).toRad();

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return Math.round(d);
  }

  function distance(from,to,isVicenty){
    if (isVicenty){
      return distVincenty(from[1],from[0],to[1],to[0]);
    } else {
      return harvesine(from[1],from[0],to[1],to[0]);
    }
  }

  function getGeoPoint(feature){
    return ol.proj.transform(feature.getGeometry().getCoordinates(),'EPSG:3857','EPSG:4326');
  }

  var lFeat = this.features[this.opts.left.div];
  var rFeat = this.features[this.opts.right.div];

  if (lFeat && rFeat){
    // Get the geodesic points

    // features
    var lll = getGeoPoint(lFeat);
    var rll = getGeoPoint(rFeat);

    // views
    var clll = this.leftMap.getViewGeoPoint();
    var crll = this.rightMap.getViewGeoPoint();


    // Render the template
    $('#distance').html(
        lFeat.getProperties()[this.opts.left.nameProp] + ' and ' +
        rFeat.getProperties()[this.opts.right.nameProp] + ' are ' +
        distance(lll,rll,false).toFixed(0) + ' kms away!! (' +
        xyzDist(lll,rll).toFixed(1) + ' km as a tunnel)'
      );

    // update school details
    var updateDetails = function(opts,feature,center){
      $(opts.detailDiv + " .schoolname").text(feature.getProperties()[opts.nameProp || '...']);
      $(opts.detailDiv + " .schooladdress").text( feature.getProperties()[opts.addressProp] || '...');
      $(opts.detailDiv + " .disttocross").text(distance(getGeoPoint(feature),center,true).toFixed(1)  + " kms");
    }

    updateDetails(this.opts.left,lFeat,clll);
    updateDetails(this.opts.right,rFeat,crll);
  }
};


/*
  Execution starts here
*/
new AntipodesMaps({
  center: ol.proj.transform([  -7.0247 , 40.7536 ], 'EPSG:4326', 'EPSG:3857'),
  zoom: 5,
  maxResolution: 200,
  left : {
    'div':'leftmap',
    'feat': '#lfeat',
    'data': '../data/data_es.geojson',
    'nameProp': 'name',
    'addressProp': 'address',
    'detailDiv':'#leftmapdetails'
  },
  right : {
    'div':'rightmap',
    'feat': '#rfeat',
    'data': '../data/data_nz.geojson',
    'nameProp': 'name',
    'addressProp': 'address',
    'detailDiv':'#rightmapdetails'
  },
  dist: '#dist'
});

