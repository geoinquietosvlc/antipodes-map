'use strict';

var antipode = function(center){
  var clt = ol.proj.transform(center, 'EPSG:3857', 'EPSG:4326');
  var lon = clt[0] > 0 ? clt[0] - 180 : clt[0] + 180;
  var lat = clt[1] * -1;
  return ol.proj.transform([lon,lat], 'EPSG:4326', 'EPSG:3857');
};

var galiciaCenter = ol.proj.transform([-7.2, 42.7], 'EPSG:4326', 'EPSG:3857');

var leftView = new ol.View({
      center: galiciaCenter,
      zoom: 7
});

var rightView = new ol.View({
      center: antipode(galiciaCenter),
      zoom: 7
});


// Features
var pointFeature = new ol.Feature(new ol.geom.Point(galiciaCenter ));
var apointFeature = new ol.Feature(new ol.geom.Point(antipode(galiciaCenter) ));

// Source and vector layer
var vectorSource = new ol.source.Vector({projection: 'EPSG:4326'});
vectorSource.addFeatures([pointFeature]);
var vectorLayer = new ol.layer.Vector({source: vectorSource });

var aVectorSource = new ol.source.Vector({projection: 'EPSG:4326'});
aVectorSource.addFeatures([apointFeature]);
var aVectorLayer = new ol.layer.Vector({source: aVectorSource });


new ol.Map({
    target: 'map',
    renderer: 'canvas',
    layers: [
          new ol.layer.Tile({
              source: new ol.source.OSM()
          }),
          vectorLayer
    ],
    view: leftView
});

new ol.Map({
    target: 'map-antipodes',
    renderer: 'canvas',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
        aVectorLayer
    ],
    view: rightView
});


/*
TO DO, change this on method by bindTo and ussing
accessor.transform function to calculate the antipode view center
*/
leftView.bindTo('resolution', rightView);
leftView.bindTo('rotation', rightView);

var accessor = leftView.bindTo('center', rightView);
accessor.transform(
    function(center) {
      if (center)
        return antipode(center);
    },
    function(center) {
      if (center)
        return antipode(center);
    }
);

leftView.on('change:center',function(evt){
  pointFeature.setGeometry(new ol.geom.Point(evt.target.getCenter()));
  apointFeature.setGeometry(new ol.geom.Point(antipode(evt.target.getCenter())));
});



console.log('hola' + 'juas');
