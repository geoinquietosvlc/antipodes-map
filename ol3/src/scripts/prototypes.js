/**
 * @param {number} n The max number of characters to keep.
 * @return {string} Truncated string.
 */
String.prototype.trunc = String.prototype.trunc ||
    function(n) {
      return this.length > n ? this.substr(0, n - 1) + '...' : this.substr(0);
    };

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === 'undefined') {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  };
}

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toDeg) === 'undefined') {
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  };
}

var addCommas = function(nStr)
{
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

/**
 * Custom control to add a cross in the middle of the map
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
function CenterCrossControl(optOptions) {
  var options = optOptions || {};
  var element = document.createElement('div');
  element.className = 'center-cross ol-unselectable';

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

}
ol.inherits(CenterCrossControl, ol.control.Control);


/**
 * jQuery small plugin to get URL parameters
 */
$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});
