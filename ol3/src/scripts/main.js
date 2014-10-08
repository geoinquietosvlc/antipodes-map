'use strict';

var antipode = function(center){
  var clt = ol.proj.transform(center, 'EPSG:3857', 'EPSG:4326');
  var lon = clt[0] > 0 ? clt[0] - 180 : clt[0] + 180;
  var lat = clt[1] * -1;
  return ol.proj.transform([lon,lat], 'EPSG:4326', 'EPSG:3857');
};

var leftView = new ol.View({
      center: ol.proj.transform([-7.2, 42.7], 'EPSG:4326', 'EPSG:3857'),
      zoom: 7
});

var rightView = new ol.View({
      center: ol.proj.transform([-7.2 + 180, -42.7], 'EPSG:4326', 'EPSG:3857'),
      zoom: 7
});

new ol.Map({
  target: 'map',
  renderer: 'canvas',
  layers: [
      new ol.layer.Tile({
          source: new ol.source.MapQuest({
              layer: 'osm'
          })
      })
  ],
  view: leftView
});

new ol.Map({
    target: 'map-antipodes',
    renderer: 'canvas',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: rightView,
    controls: []
});


/*
TO DO, change this on method by bindTo and ussing 
accessor.transform function to calculate the antipode view center
*/

leftView.on('change:center',function(evt){
  rightView.setCenter(antipode(evt.target.getCenter()));
});

leftView.on('change:resolution',function(evt){
  rightView.setResolution(evt.target.getResolution());
});

leftView.on('change:rotation',function(evt){
  rightView.setRotation(evt.target.getRotation());
});


console.log('hola' + 'juas');
