var Trie = require('level-trie');
var sublevel = require('level-sublevel');
var through = require('through');
var geohash = require('geo-hash');
var encode = geohash.encode;
var decode = geohash.decode;
var ordered = require('ordered-through');
var throughout = require('throughout');
var shutup = require('shutup');

module.exports = Places;

function Places (db) {
  if (!(this instanceof Places)) return new Places(db);
  sublevel(db);
  this.data = db.sublevel('data');
  this.trie = Trie(shutup(db.sublevel('trie')));
}

Places.prototype.add = function (data, lat, lon, fn) {
  if (typeof lat == 'object') {
    fn = lon;
    lon = lon in lat? lat.lon : lat.longitude;
    lat = lat in lat? lat.lat : lat.latitude;
  }

  var rand = Math.random().toString(16).slice(2);
  var hash = encode(lat, lon) + rand;
  var trie = this.trie;

  this.data.put(hash, data, { valueEncoding: 'json' }, function (err) {
    if (err) return fn && fn(err);
    trie.add(hash, fn);
  });
};

Places.prototype.createReadStream = function (lat, lon, opts) {
  if (typeof lat == 'object') {
    opts = lon;
    lon = lat.longitude;
    lat = lat.latitude;
  }
  opts = opts || {};

  var data = this.data;
  var search = this.trie.createSearchStream(encode(lat, lon), opts);

  var get = ordered(function (key, cb) {
    data.get(key, { valueEncoding: 'json' }, function (err, name) {
      if (err) {
        cb(err);
      } else if (!opts.position) {
        cb(null, name);
      } else {
        var hash = key.substring(0, 12);
        var position = decode(hash);
        cb(null, {
          name: name,
          position: {
            latitude: position.lat,
            longitude: position.lon
          }
        }); 
      }
    });
  });

  var tr = throughout(search, get);
  tr.writable = false;
  return tr;
};

