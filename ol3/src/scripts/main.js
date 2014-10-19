'use strict';


/*
  Execution starts here
*/
$( document ).ready(function() {
  $('#help').show();

  new AntipodesMaps({
    center: ol.proj.transform([  -4.4 , 40.5 ], 'EPSG:4326', 'EPSG:3857'),
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

  // Recenter cross

  // Get the map width
  var mapwidth = parseInt($('.map').css('width').replace('px',''));
  var crosswidth = parseInt($('.center-cross').css('width').replace('px',''));
  var leftCross = (mapwidth - crosswidth) / 2;

  $('.center-cross').css('left',leftCross + 'px');

});
