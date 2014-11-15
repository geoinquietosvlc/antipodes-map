'use strict';


/*
  Execution starts here
*/
$( document ).ready(function() {
  $('#help').show();

  var config = JSON.stringify({
      "version": "1.0.0",
      "stat_tag": "API",
      "layers": [
        {
          "type": "cartodb",
          "options": {
            "sql": "select * from Registro_centros_es",
            "cartocss": "#registro_centros_es{marker-fill: #FFCC00; marker-width: 10; marker-line-color: #FFF; marker-line-width: 1.5; marker-line-opacity: 1; marker-fill-opacity: 0.9; marker-comp-op: multiply; marker-type: ellipse; marker-placement: point; marker-allow-overlap: true; marker-clip: false; marker-multi-policy: largest; }",
            "cartocss_version": "2.1.0"
          }
        }
      ]
    });


  $.ajax({
    url: "https://vehrka.cartodb.com/api/v1/map?config=" + encodeURIComponent(config),
    contentType: 'text/plain',
    xhrFields: {
      withCredentials: false
    },
    success: function(obj){
      debugger;

      var spainLayer = new ol.layer.Tile({
          source: new ol.source.XYZ({
            attributions: [
              new ol.Attribution({
                html: 'CartoDB &copy; <a href="http://vehrka.cartodb.com/">' + 'Vehrka</a>' }),
              ol.source.OSM.DATA_ATTRIBUTION
            ],
            url: 'http://{0-3}.' + obj.cdn_url.http + '/vehrka/api/v1/map/' + obj.layergroupid + '/{z}/{x}/{y}.png'
          })
        });

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
          'detailDiv':'#leftmapdetails',
          'layer' : spainLayer
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

    },
    dataType: "jsonp"
  });




});
