var through = require('through');
var geohash = require('geohash').GeoHash.encodeGeoHash;
var shutup = require('shutup');

module.exports = Places;

function Places (db) {
  if (!(this instanceof Places)) return new Places(db);
  this.db = db;
}

Places.prototype.add = function (data, lat, lon, fn) {
  var hash = geohash(lat, lon);
  var rand = Math.random().toString(16).slice(2);
  // todo: use monotonic-timestamp

  this.db.batch(hash.split('').map(function (_, i) {
    return {
      type: 'put',
      key: hash.substr(0, i+1) + '!' + rand,
      valueEncoding: 'json',
      value: {
        hash: hash + rand,
        data: data
      }
    };
  }), fn);
};

Places.prototype.createReadStream = function (lat, lon, opts) {
  if (!opts) opts = {};

  var db = this.db;
  var found = [];
  var limit = typeof opts.limit != 'undefined'? opts.limit : Infinity;
  var outer = shutup(through());
  // todo: use pull-streams

  function read (hash) {
    var vs = db.createValueStream({ start: hash, valueEncoding: 'json' });
    var inner = through(write, end);

    function write (val) {
      if (found.indexOf(val.hash) != -1) return;
      found.push(val.hash);
      inner.queue(val.data);
      if (found.length == limit) vs.destroy();
    }
    function end () {
      hash.length > 0 && found.length < limit
        ? read(hash.substr(0, hash.length - 1))
        : outer.end();
    }

    vs.pipe(inner).pipe(outer, { end: false });
  }
  
  process.nextTick(function () {
    read(geohash(lat, lon));
    // todo: or use setImmediate
  });

  return outer;
};

