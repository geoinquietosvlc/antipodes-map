'use strict';

/*
  Execution starts here
*/
$( document ).ready(function() {
  // Configure the tour
  $('#help').show();
  alertify.set({ delay: 3000 });



  // Configure the viewer
  new AntipodesMaps({
    center: ol.proj.transform([  -4.4 , 40.5 ], 'EPSG:4326', 'EPSG:3857'),
    zoom: 5,
    maxResolution: 200,
    cartodb:{
      user: 'vehrka',
      viz: '9fede618-6e3d-11e4-8fc1-0e853d047bba'
    },
    verbose: $.getUrlVar('v'),
    left : {
      'div':'leftmap',
      'feat': '#lfeat',
      'detailDiv':'#leftmapdetails',
      'properties': {
        'tablename': 'Registro_centros_es',
        'layername': 'registro_centros_es',
        'name'     : 'dee',
        'address'  : 'adr',
        'lat'      : 'lat',
        'lon'      : 'lon',
        'id'       : 'cod'
      }
    },
    right : {
      'div':'rightmap',
      'feat': '#rfeat',
      'detailDiv':'#rightmapdetails',
      'properties': {
        'tablename': 'registro_centros_nz',
        'layername': 'registro_centros_nz',
        'name'    : 'name',
        'address' : 'physical_address',
        'lat'     : 'latitude',
        'lon'     : 'longitude',
        'id'      : 'zid'
      }
    },
    dist: '#dist'
  });
});
