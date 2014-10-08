'use strict';

/*
  Main class constructor
*/
function AntipodeMap(center,divId){
  /* initial center for the map */
  this.center = center;
  /* div Id where the map will be rendered */
  this.divId = divId;
  /* geometry */
  this.geomCenter =  new ol.geom.Point(this.center);
  /* ol view */
  this.view = new ol.View({
    center: this.center,
    zoom: 7
  });
  /* ol3 map */
  this.map = new ol.Map({
    target: this.divId,
    renderer: 'canvas',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.Stamen({layer: 'watercolor'})
      })
    ],
    view: this.view
  });
  /* add the centroid vector layer */
  this.addCenterLayer();
  /* add the cities vector layer */
  this.addCitiesLayer();
}


/* Add a new vector layer with just one feature. That
 feature geometry will be synced with the view center.*/
AntipodeMap.prototype.addCenterLayer = function() {
  /* create a feature with this.geomCenter */
  var centerFeature = new ol.Feature(this.geomCenter);
  /* add a cross image style*/
  centerFeature.setStyle(new ol.style.Style({
    image: new ol.style.Icon(({
    scale: 1,
    rotation: 90 * Math.PI / 180,
    anchor: [0.5, 0.5],
    anchorXUnits: 'fraction',
    anchorYUnits: 'fraction',
    src: '../images/cross-18.png'
    }))
  }));
  /* create a vector souce and add our feature to it*/
  var vectorSource = new ol.source.Vector({projection: 'EPSG:4326'});
  vectorSource.addFeatures([centerFeature]);

  /* create a new vector layer with this source and add it to the map*/
  var vectorLayer = new ol.layer.Vector({source: vectorSource });
  this.map.addLayer(vectorLayer);

  /* subscribe to the map view to update the
    feature geom with the new center */
  this.getView().on('change:center',function(evt){
    centerFeature.setGeometry(new ol.geom.Point(evt.target.getCenter()));
  });
};

/* Add a geojson cities layer */
AntipodeMap.prototype.addCitiesLayer = function(){
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

  /* add to the map a vector layer from a geojson*/
  this.map.addLayer(new ol.layer.Vector({
    source: new ol.source.GeoJSON({
      url: 'data/world_cities.json',
      projection: 'EPSG:3857'
    }),
    style: styleFunction
  }));
};

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

/* bind the instance map view to an external view, using
  the antipode method to sync those views using it*/
AntipodeMap.prototype.bindView = function(anotherView){
  var leftView = this.getView();
  var rightView = anotherView;
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
};

/* return a binded antipodes map */
AntipodeMap.prototype.getAntipode = function(divId) {
  var center = this.antipode(this.getView().getCenter());
  var antipodemap = new AntipodeMap(center,divId);
  this.bindView(antipodemap.getView());

  return antipodemap;
};

/* bind two dom elements (jquery selectors) to the view center*/
AntipodeMap.prototype.bindLonLat = function(lon,lat){
  this.getView().on('change:center',function(evt){
    var center = ol.proj.transform(evt.target.getCenter(),'EPSG:3857','EPSG:4326');
    $(lon).text(center[0].toFixed(4));
    $(lat).text(center[1].toFixed(4));
  });
};


/*
  Execution starts here
*/

/* define starting point */
var galiciaCenter = ol.proj.transform([-7.2, 42.7], 'EPSG:4326', 'EPSG:3857');
/* instance first map */
var leftMap = new AntipodeMap(galiciaCenter,'leftmap');
/* get the antipodes map */
var rightMap = leftMap.getAntipode('rightmap');

/* Bind lat-lons */
leftMap.bindLonLat('#lmaplon','#lmaplat');
rightMap.bindLonLat('#rmaplon','#rmaplat');






