'use strict';

/**
 * Class to coordinate work together
 */
function AntipodesMaps(opts) {
  this.opts = opts;
  this.leftMap =  new AntipodeMap(opts.center,opts.left,this);
  this.rightMap = this.leftMap.getAntipode(opts.right);
  this.schools = {
    "es":{},
    "nz":{}
  };

  this.setUpTriggers(this.leftMap);



/*  var features = {};
  features[opts.left.div] =  null;
  features[opts.right.div] = null;

  this.features = features;*/
}

AntipodesMaps.prototype.setUpTriggers = function(antipodeMap){
  var map = antipodeMap.map;
  var ctx = this;

  map.on('moveend',function(){
    var center = ol.proj.transform(this.getView().getCenter(),'EPSG:3857','EPSG:4326');

    var distSQL = 'SELECT cod_es, cod_nz, dist, tunn FROM gvlc_getschools(st_geomfromtext(\'POINT('
      + center[0] + ' ' + center[1] + ')\'))';

    ctx.sqlLoader(distSQL).then(
      function(response){
        var result = response.rows[0];
        ctx.updateDist(result);
      }, function(error){
        if (console && console.error){
          console.error(error);
        }
      }
    );
  });
}

AntipodesMaps.prototype.sqlLoader = function(sql) {
  return Promise.resolve($.ajax({
    url: 'https://'+ this.opts.cartoUser + '.cartodb.com/api/v2/sql?q=' + encodeURIComponent(sql),
    contentType: 'text/plain',
    xhrFields: {
      withCredentials: false
    },
    dataType: "jsonp"
  }));
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
    return 'SELECT * FROM ' + opts.table + ' WHERE ' + opts.idField + ' like \'' + id + '\'';
  }

  var schoolLoader = function(map,id){
    var sql = schoolSQL(map.opts.cartoLayer, id);
    return ctx.sqlLoader(sql);
  }

  // Try to get the schools from the cache
  var lFeat = this.schools.es[distData.cod_es] ;
  var rFeat = this.schools.nz[distData.cod_nz] ;

  // If we got them, just assign them and move to the schools loading
  if (lFeat && rFeat){
    this.leftMap.feat = lFeat;
    this.rightMap.feat = rFeat;
    this.loadSchoolsData(distData);
  } else {
    // Take the info from CartoDB
    schoolLoader(ctx.leftMap,distData.cod_es).then(function(leftResp){
      ctx.leftMap.feat = leftResp.rows[0];
      ctx.schools.es[distData.cod_es] = leftResp.rows[0];
      schoolLoader(ctx.rightMap,distData.cod_nz).then(function(rightResp){
        ctx.rightMap.feat = rightResp.rows[0];
        ctx.schools.nz[distData.cod_nz]= rightResp.rows[0];
        ctx.loadSchoolsData(distData);
      })
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

    var geoPoint = [feature[props.lon],feature[props.lat]];
    var geoCenter = map.getViewGeoPoint();
    var xyPoint = getXYPoint(geoPoint);
    var xyCenter = map.getView().getCenter();

    // Set the selector
    // var optionSelector = opts.detailDiv + ' .select-school';
    // $(optionSelector)[0].selectize.setValue(feature.getProperties()[opts.idProp || 'id']);

    $(opts.detailDiv + ' .schoolname')
      .text(feature[props.name]);

    // Set the school details
    // $(opts.detailDiv + " .schoolname").text(feature.getProperties()[opts.nameProp || '...']);
    $(opts.detailDiv + " .schooladdress")
      .text(feature[props.address] || '...');
    $(opts.detailDiv + " .lon")
      .text(geoPoint[0].toFixed(4));
    $(opts.detailDiv + " .lat")
      .text(geoPoint[1].toFixed(4));
    var dist = geom.distance(geoPoint,geoCenter,true);
    $(opts.detailDiv + " .disttocross")
      .text( dist.toFixed(1)  + " kms");
    var dir;
    if ( dist < .1 ) {
      dir = '';
    } else {
      dir = geom.direction(xyCenter,xyPoint).toFixed(4)+'º'
    }
    $(opts.detailDiv + " .direction").text(dir);
  }

  var lFeat = this.leftMap.feat;
  var rFeat = this.rightMap.feat;
  var dist = distData.dist;
  var tunn = distData.tunn;

  if (lFeat && rFeat){
    // Get the geodesic points

    // features
    var lll = lFeat.lon;
    var rll = lFeat.lat;

    // views
    var clll = this.leftMap.getViewGeoPoint();
    var crll = this.rightMap.getViewGeoPoint();


    // Render the template
    $('#distance').html(
        '<em class="text-primary">' +
        lFeat[this.opts.left.properties.name] + '</em> and ' +
        '<em class="text-primary">' +
        rFeat[this.opts.right.properties.name] + '</em> are ' +
        '<strong class="text-info">' +
        addCommas(dist.toFixed(1)) + '</strong> kms away!! '+
        '(<strong class="text-info">' +
        addCommas(tunn.toFixed(1)) + '</strong> km as a tunnel)'
    );
    updateDetails(this.leftMap,lFeat);
    updateDetails(this.rightMap,rFeat);
  }
};
