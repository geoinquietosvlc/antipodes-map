'use strict';

function Geom(ellipsoid){
  this.ellipsoid = ellipsoid || {a : 6378137, b : 6356752.314245, f : 1 / 298.257223563};
}

Geom.prototype.xyzDist = function(from,to) {
  var cartesian = function(ellipsoid,point){
    var lat = point[1], lon = point[0];
    var φ = lat.toRad(), λ = lon.toRad(), H = 0;
    var a = ellipsoid.a, b = ellipsoid.b;

    var sinφ = Math.sin(φ), cosφ = Math.cos(φ);
    var sinλ = Math.sin(λ), cosλ = Math.cos(λ);

    var eSq = (a*a - b*b) / (a*a);
    var ν = a / Math.sqrt(1 - eSq*sinφ*sinφ);

    var x = (ν+H) * cosφ * cosλ;
    var y = (ν+H) * cosφ * sinλ;
    var z = ((1-eSq)*ν + H) * sinφ;

    var pointXYZ = {x:x,y:y,z:z};

    return pointXYZ;
  };

  var sqDif = function(a,b){return Math.pow (a - b,2)};

  var fromC = cartesian(this.elliposid,from), toC = cartesian(this.ellipsoid,to);

  return Math.sqrt(sqDif(fromC.x,toC.x) + sqDif(fromC.y,toC.y) + sqDif(fromC.z,toC.z))/1000;
};


/**
 * Code from http://jsperf.com/vincenty-vs-haversine-distance-calculations
 *
 * Calculates geodetic distance between two points specified by latitude/longitude using
 * Vincenty inverse formula for ellipsoids
 *
 * @param   {Number} lat1, lon1: first point in decimal degrees
 * @param   {Number} lat2, lon2: second point in decimal degrees
 * @returns (Number} distance in metres between points
 */
Geom.prototype.distVincenty = function(lat1,lon1,lat2,lon2) {
  var a = this.ellipsoid.a,
      b = this.ellipsoid.b,
      f = this.ellipsoid.f; // WGS-84 ellipsoid params
  var L = (lon2 - lon1).toRad();
  var U1 = Math.atan((1 - f) * Math.tan(lat1.toRad()));
  var U2 = Math.atan((1 - f) * Math.tan(lat2.toRad()));
  var sinU1 = Math.sin(U1),
      cosU1 = Math.cos(U1);
  var sinU2 = Math.sin(U2),
      cosU2 = Math.cos(U2);

  var lambda = L,
      lambdaP, iterLimit = 300;
  do {
    var sinLambda = Math.sin(lambda),
        cosLambda = Math.cos(lambda);
    var sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
    if (sinSigma == 0) return 0; // co-incident points
    var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    var sigma = Math.atan2(sinSigma, cosSigma);
    var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    var cosSqAlpha = 1 - sinAlpha * sinAlpha;
    var cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
    if (isNaN(cos2SigmaM)) cos2SigmaM = 0; // equatorial line: cosSqAlpha=0 (§6)
    var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  } while (Math.abs(lambda - lambdaP) > 1e-9 && --iterLimit > 0);

  if (iterLimit == 0) return NaN // formula failed to converge
  var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
  var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
  var s = b * A * (sigma - deltaSigma);

  return s/1000;
};

// Distance in kilometers between two points using the Haversine algo.
Geom.prototype.harvesine = function(lat1,lon1,lat2,lon2) {
  var R = (this.ellipsoid.a + this.ellipsoid.b) / 2 / 1000;
  var dLat = (lat2 - lat1).toRad();
  var dLong = (lon2 - lon1).toRad();

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  return Math.round(d);
};

Geom.prototype.distance = function(from,to,isVicenty) {
  if (isVicenty){
    return this.distVincenty(from[1],from[0],to[1],to[0]);
  } else {
    return this.harvesine(from[1],from[0],to[1],to[0]);
  }
};

Geom.prototype.direction = function(from,to) {
  var iY = to[1] - from[1];
  var iX = to[0] - from[0];

  var res = Math.atan2(iX,iY).toDeg();

  return res < 0 ? res + 360 : res;
};


