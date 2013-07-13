// todo: use pull streams
var through = require('through');
var geohash = require('geohash').GeoHash.encodeGeoHash;
var shutup = require('shutup');

module.exports = Places;

function Places (db) {
  if (!(this instanceof Places)) return new Places(db);
  this.db = db;
}

/**
 * @param {Object} data
 * @param {Number} lat
 * @param {Number} lon
 * @param {Function=} fn
 */

Places.prototype.add = function (data, lat, lon, fn) {
  var hash = geohash(lat, lon);
  var rand = Math.random().toString(16).slice(2);
  // todo: make new batch api usable
  // var batch = this.db.batch();
  var ops = [];

  for (var i = 0; i < hash.length; i++) {
    ops.push({
      type: 'put',
      key: hash.substr(0, i+1) + '!' + rand,
      value: {
        hash: hash + rand,
        data: data
      }
    });
  }

  this.db.batch(ops, { valueEncoding : 'json' }, fn);
};

/**
 * @param {Number} lat
 * @param {Number} lon
 * @param {Object=} opts
 */

Places.prototype.createReadStream = function (lat, lon, opts) {
  if (!opts) opts = {};
  var db = this.db;
  var found = [];
  var limit = typeof opts.limit != 'undefined'
    ? opts.limit
    : Infinity;
  var outer = shutup(through());

  (function read (hash) {
    var rs = db.createValueStream({ start: hash, valueEncoding: 'json' });
    var inner = through(write, end);

    function write (val) {
      if (found.indexOf(val.hash) == -1) {
        found.push(val.hash);
        inner.queue(val.data);
        if (found.length == limit) rs.destroy();
      }
    }
    function end () {
      if (hash.length > 0 && found.length < limit) {
        read(hash.substr(0, hash.length - 1));
      } else {
        outer.end();
      }
    }

    rs.pipe(inner).pipe(outer, { end: false });

  })(geohash(lat, lon));

  return outer;
};
