'use strict';

/*
  Execution starts here
*/
$( document ).ready(function() {
  // Configure the tour
  $('#help').show();

  // Configure the viewer
  new AntipodesMaps({
    center: ol.proj.transform([  -4.4 , 40.5 ], 'EPSG:4326', 'EPSG:3857'),
    zoom: 5,
    maxResolution: 200,
    cartoUser: 'vehrka',
    left : {
      'div':'leftmap',
      'feat': '#lfeat',
      'properties': {
        'name' : 'dee',
        'address' : 'adr',
        'lat' : 'lat',
        'lon' : 'lon'
      },
      'detailDiv':'#leftmapdetails',
      'cartoLayer' : {
        'css' : '#registro_centros_es{marker-fill: #FFCC00; marker-width: 10; marker-line-color: #FFF; marker-line-width: 1.5; marker-line-opacity: 1; marker-fill-opacity: 0.9; marker-comp-op: multiply; marker-type: ellipse; marker-placement: point; marker-allow-overlap: true; marker-clip: false; marker-multi-policy: largest; }',
        'table' : 'Registro_centros_es',
        'idField': 'cod'
      }
    },
    right : {
      'div':'rightmap',
      'feat': '#rfeat',
      'properties': {
        'name' : 'name',
        'address' : 'physical_address',
        'lat' : 'latitude',
        'lon' : 'longitude'
      },
      'detailDiv':'#rightmapdetails',
      'cartoLayer' : {
        'css' : '#registro_centros_nz{marker-fill: #FFCC00; marker-width: 10; marker-line-color: #FFF; marker-line-width: 1.5; marker-line-opacity: 1; marker-fill-opacity: 0.9; marker-comp-op: multiply; marker-type: ellipse; marker-placement: point; marker-allow-overlap: true; marker-clip: false; marker-multi-policy: largest; }',
        'table' : 'Registro_centros_nz',
        'idField': 'zid'
      }
    },
    dist: '#dist'
  });

  // Set up the central cross position
  var mapwidth = parseInt($('.map').css('width').replace('px',''));
  var crosswidth = parseInt($('.center-cross').css('width').replace('px',''));
  var leftCross = (mapwidth - crosswidth) / 2;

  $('.center-cross').css('left',leftCross + 'px');
});
