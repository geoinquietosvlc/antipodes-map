'use strict';

/**
 * Class to coordinate work together
 */
function AntipodesMaps(opts) {
  this.opts = opts;
  this.verbose = opts.verbose != null || false;
  var ctx = this;

  // http://vehrka.cartodb.com/api/v2/viz/9fede618-6e3d-11e4-8fc1-0e853d047bba/viz.json

  $.ajax({
    url: 'http://'+ this.opts.cartodb.user + '.cartodb.com/api/v2/viz/' + this.opts.cartodb.viz + '/viz.json',
    contentType: 'text/plain',
    xhrFields: {
      withCredentials: false
    },
    dataType: "jsonp"
  }).then(function (response){
    if (ctx.verbose){
      alertify.success("Data visualization configuration loaded!");
    }
    // Configure map options with CartoDB Response
    var layers = response.layers[1].options.layer_definition.layers;
    var esData = layers.filter(function(l){
        return l.options.layer_name === opts.left.properties.layername;
      });
    var nzData = layers.filter(function(l){
        return l.options.layer_name === opts.right.properties.layername
      });

    if (esData.length == 1 && nzData.length == 1){
      opts.left.cartodb = esData[0].options;
      opts.right.cartodb = nzData[0].options;
    }

    ctx.setUpMaps(opts);
  });
}

AntipodesMaps.prototype.setUpMaps = function(opts) {
    this.leftMap =  new AntipodeMap(opts.center,opts.left,this);
    this.rightMap = this.leftMap.getAntipode(opts.right);
    this.schools = {
      "es":{},
      "nz":{}
    };

    this.setUpTriggers(this.leftMap);

    // Set up the central cross position
    var mapwidth = parseInt($('.map').css('width').replace('px',''));
    var crosswidth = parseInt($('.center-cross').css('width').replace('px',''));
    var leftCross = (mapwidth - crosswidth) / 2;

    $('.center-cross').css('left',leftCross + 'px');
};

AntipodesMaps.prototype.setUpTriggers = function(antipodeMap){
  var map = antipodeMap.map;
  var ctx = this;

  map.on('moveend',function(event){

    var now = new Date();
    var doIt = false;

    if (! ctx.lastDistSQL){
      ctx.lastDistSQL = now;
      doIt = true;
    } else if (ctx.lastDistSQL && (now - ctx.lastDistSQL) > 200 ){
      doIt = true;
    }

    if (doIt){
      var center = ol.proj.transform(this.getView().getCenter(),'EPSG:3857','EPSG:4326');

      var distSQL = 'SELECT cod_es, cod_nz, dist, tunn FROM gvlc_getschools(st_geomfromtext(\'POINT('
        + center[0] + ' ' + center[1] + ')\'))';

      ctx.sqlLoader(distSQL).then(
        function(response){
          if (ctx.verbose){
            alertify.success("Distance between schools retreived");
          }
          var result = response.rows[0];
          ctx.updateDist(result);
        }, function(error){
          msgError("Error obtaining distance of schools",error,ctx.verbose);
        }
      );

      ctx.lastDistSQL = new Date();
    }


  });
}

AntipodesMaps.prototype.sqlLoader = function(sql,isGeoJSON) {
  var geojson = isGeoJSON ? "&format=geojson" : "";
  var url = 'https://'+ this.opts.cartodb.user + '.cartodb.com/api/v2/sql?q=' + encodeURIComponent(sql) + geojson;
  if (this.verbose){
    console.log("sqlLoader: " + sql);
  }
  return $.ajax({
    url: url,
    contentType: 'text/plain',
    xhrFields: {
      withCredentials: false
    },
    dataType: "jsonp"
  });
}

AntipodesMaps.prototype.updateDist = function(distData) {
  var ctx = this;

  function direction(from,to){
    var iY = to[1] - from[1];
    var iX = to[0] - from[0];
    var res = Math.atan2(iX,iY).toDeg();
    return res < 0 ? res + 360 : res;
  }

  var schoolSQL = function(opts, id) {
    var sql = 'WITH Q AS (' + opts.cartodb.sql + ') SELECT * FROM Q WHERE '
      + opts.properties.id + ' like \'' + id + '\'';

    return sql;
  }

  var schoolLoader = function(map,id){
    var sql = schoolSQL(map.opts, id);
    return ctx.sqlLoader(sql,true);
  }

  // Try to get the schools from the cache
  var lFeat = this.schools.es[distData.cod_es] ;
  var rFeat = this.schools.nz[distData.cod_nz] ;

  // If we got them, just assign them and move to the schools loading
  if (lFeat && rFeat){
    if (ctx.verbose){
      alertify.success("Rows " + distData.cod_es
      + " and " + distData.cod_nz + " loaded from cache");
    }
    this.leftMap.feat = lFeat;
    this.rightMap.feat = rFeat;
    this.loadSchoolsData(distData);
  } else {
    // Take the info from CartoDB
    var defLeft = schoolLoader(ctx.leftMap,distData.cod_es);
    var defRight = schoolLoader(ctx.rightMap,distData.cod_nz);

    $.when(defLeft,defRight).done(function(leftResp,rightResp){
      //debugger;
      if (ctx.verbose){
        alertify.success("Rows " + distData.cod_es
          + " and " + distData.cod_nz + " retrieved from CartoDB");
      }
      var lResult = leftResp[0];
      var rResult = rightResp[0];

      if (lResult && rResult){
        var lRow = lResult.features[0];
        var rRow = rResult.features[0];

        ctx.schools.es[distData.cod_es] = ctx.leftMap.feat = lRow;
        ctx.schools.nz[distData.cod_nz] = ctx.rightMap.feat = rRow;

        ctx.loadSchoolsData(distData);
      } else {
        msgError("Error receiving row data","",ctx.verbose);
      }


    });
  }
};


AntipodesMaps.prototype.loadSchoolsData = function(distData) {

  var geom = new Geom();

  function getXYPoint(feature){
    return ol.proj.transform(feature,'EPSG:4326','EPSG:3857');
  }

  // update school details
  var updateDetails = function(map,feature){
    var opts = map.opts;
    var props = opts.properties

    var geoPoint = feature.geometry.coordinates;
    var geoCenter = map.getViewGeoPoint();
    var xyPoint = getXYPoint(geoPoint);
    var xyCenter = map.getView().getCenter();

    // Set the selector or print the div
    var divDetails = $(opts.idprefix + '-details');
    divDetails.find('.schoolname')
      .text(feature.properties[props.name]);

    if (feature.properties['spanish'] === 1){
      divDetails.find('.isSpanish').show();
    } else {
      divDetails.find('.isSpanish').hide();
    }


    divDetails.find(" .schooladdress")
      .text(feature.properties[props.address] || '...');
    divDetails.find(" .lon")
      .text(geoPoint[0].toFixed(4));
    divDetails.find(" .lat")
      .text(geoPoint[1].toFixed(4));
    var dist = geom.distance(geoPoint,geoCenter,true);
    divDetails.find(" .disttocross")
      .text( dist.toFixed(1)  + " kms");
    var dir;
    if ( dist < .1 ) {
      dir = '';
    } else {
      dir = geom.direction(xyCenter,xyPoint).toFixed(4)+'º'
    }
    $(opts.idprefix + "-details .direction").text(dir);
  }

  var lFeat = this.leftMap.feat;
  var rFeat = this.rightMap.feat;
  var dist = distData.dist / 1000;
  var tunn = distData.tunn;

  if (lFeat && rFeat){
    // Add the overlays
    this.leftMap.displayClosestCity(lFeat);
    this.rightMap.displayClosestCity(rFeat);

    // features
    var lll = lFeat.lon;
    var rll = lFeat.lat;

    // views
    var clll = this.leftMap.getViewGeoPoint();
    var crll = this.rightMap.getViewGeoPoint();


    // Render the template
    $('#distance').html(
        '<em class="text-primary">' +
        lFeat.properties[this.opts.left.properties.name] + '</em> and ' +
        '<em class="text-primary">' +
        rFeat.properties[this.opts.right.properties.name] + '</em> are ' +
        '<strong class="text-info">' +
        addCommas(dist.toFixed(1)) + '</strong> kms away!! '+
        '(<strong class="text-info">' +
        addCommas(tunn.toFixed(1)) + '</strong> km as a tunnel)'
    );
    updateDetails(this.leftMap,lFeat);
    updateDetails(this.rightMap,rFeat);
  }
};
