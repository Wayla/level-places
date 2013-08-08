var Trie = require('level-trie');
var sublevel = require('level-sublevel');
var through = require('through');
var geohash = require('geo-hash');
var encode = geohash.encode;
var decode = geohash.decode;
var ordered = require('ordered-through');
var throughout = require('throughout');
var shutup = require('shutup');
var equal = require('deep-equal');
var once = require('once');

module.exports = Places;

function Places (db) {
  if (!(this instanceof Places)) return new Places(db);
  sublevel(db);
  this.data = db.sublevel('data');
  this.trie = Trie(shutup(db.sublevel('trie')));
}

function getPosition (data, lat, lon, fn) {
  if (typeof lat == 'object') {
    lon = lon in lat? lat.lon : lat.longitude;
    lat = lat in lat? lat.lat : lat.latitude;
  }
  return { lat: lat, lon: lon };
}

function getFn (data, lat, lon, fn) {
  if (fn) return fn;
  if (typeof lon == 'function') return lon;
  return undefined;
}

Places.prototype.add = function (data, lat, lon, fn) {
  var pos = getPosition.apply(null, arguments);
  fn = getFn.apply(null, arguments);
  
  var rand = Math.random().toString(16).slice(2);
  var hash = encode(pos.lat, pos.lon) + rand;
  var trie = this.trie;

  this.data.put(hash, data, { valueEncoding: 'json' }, function (err) {
    if (err) return fn && fn(err);
    trie.add(hash, fn);
  });
};

Places.prototype.remove = function (data, lat, lon, fn) {
  var pos = getPosition.apply(null, arguments);
  fn = getFn.apply(null, arguments);
  fn = once(fn);
  
  var hash = encode(pos.lat, pos.lon);
  var trie = this.trie;
  var found = false;
  var rs = this.data.createReadStream({
    start: hash,
    end: hash + '~',
    valueEncoding: 'json'
  });
  rs.pipe(through(write, end));
  
  rs.on('error', fn);
  function write (kv) {
    if (equal(kv.value, data)) {
      found = true;
      trie.remove(kv.key, fn);
    }
  }
  function end () {
    if (!found) fn(new Error('place not found'));
  }
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

