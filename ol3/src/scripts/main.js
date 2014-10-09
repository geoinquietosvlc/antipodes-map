'use strict';

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
function AntipodeMap(center,divId,maps){
  this.divId = divId;
  this.highlight = undefined;
  this.maps = maps;

  /* ol view */
  this.view = new ol.View({
    center: center,
    zoom: 7,
    minZoom: 4
  });
  /* ol3 map */
  this.map = new ol.Map({
    target: divId,
    renderer: 'canvas',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.Stamen({layer: 'watercolor'})
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
    var fontSize = '20';
    if(resolution>=39134) {
        fontSize = '12';
    } else if(resolution>=9782) {
        fontSize = '16';
    } else if(resolution>=2444) {
        fontSize = '18';
    }

    return [new ol.style.Style({
      image: new ol.style.Icon(({
        scale: 1,
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: '../images/marker-18.png'
      })),
      text: new ol.style.Text({
          font: fontSize + ' helvetica,sans-serif',
          text: feature.get('CITY_NAME'),
          fill: new ol.style.Fill({
              color: '#000'
          }),
          stroke: new ol.style.Stroke({
              color: '#fff',
              width: 2
          })
      })
    })];
  };

  var pointsLayer = new ol.layer.Vector({
    source: new ol.source.GeoJSON({
      url: 'data/world_cities.json',
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

AntipodeMap.prototype.setupOverlay = function() {
  var layer = this.pointsLayer;
  var context = this;
  var featureOverlay = new ol.FeatureOverlay({
    map: this.map,
    style: new ol.style.Style({
      image: new ol.style.Icon(({
        scale: 1,
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: '../images/marker-18-red.png'
      }))})
  });

  this.map.on('moveend',function(){
    var center = this.getView().getCenter();
    if (layer && layer.getSource() && layer.getSource().getFeatures().length>0){
       context.displayClosestCity(center,layer.getSource(),featureOverlay);
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
    $(opts.lonSpan).text(center[0].toFixed(4));
    $(opts.latSpan).text(center[1].toFixed(4));
  });
};


/**
 * Class to coordinate work together
 */
function AntipodesMaps(opts) {
  this.opts = opts;
  this.leftMap =  new AntipodeMap(opts.center,opts.left.div,this);
  this.rightMap = this.leftMap.getAntipode(opts.right.div);

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

  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1).toRad();
    var dLong = (lon2 - lon1).toRad();

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return Math.round(d);
  }

  var lFeat = this.features[this.opts.left.div];
  var rFeat = this.features[this.opts.right.div];

  if (lFeat && rFeat){
    // Calculate the distance
    var lll = ol.proj.transform(lFeat.getGeometry().getCoordinates(),'EPSG:3857','EPSG:4326');
    var rll = ol.proj.transform(rFeat.getGeometry().getCoordinates(),'EPSG:3857','EPSG:4326');
    var dist = haversine(lll[1],lll[0],rll[1],rll[0]);

    // Render the template
    $('#distance').html(
        lFeat.getProperties().CITY_NAME + ' (' + lFeat.getProperties().CNTRY_NAME + ') and ' +
        rFeat.getProperties().CITY_NAME + ' (' + rFeat.getProperties().CNTRY_NAME + ') are ' +
        dist.toFixed(0) + ' afar!!'
      );
  }
};


/*
  Execution starts here
*/
new AntipodesMaps({
  center: ol.proj.transform([-7.2, 42.7], 'EPSG:4326', 'EPSG:3857'),
  left : {
    'div':'leftmap',
    'lonSpan':'#lmaplon',
    'latSpan': '#lmaplat',
    'feat': '#lfeat'
  },
  right : {
    'div':'rightmap',
    'lonSpan':'#rmaplon',
    'latSpan': '#rmaplat',
    'feat': '#rfeat'
  },
  dist: '#dist'
});

