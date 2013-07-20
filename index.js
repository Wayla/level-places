var Trie = require('level-trie');
var sublevel = require('level-sublevel');
var through = require('through');
var geohash = require('geo-hash').encode;
var ordered = require('ordered-through');

module.exports = Places;

function Places (db) {
  if (!(this instanceof Places)) return new Places(db);
  sublevel(db);
  this.data = db.sublevel('data');
  this.trie = Trie(db.sublevel('trie'));
}

Places.prototype.add = function (data, lat, lon, fn) {
  var rand = Math.random().toString(16).slice(2);
  var hash = geohash(lat, lon) + rand;
  var trie = this.trie;

  this.data.put(hash, data, { valueEncoding: 'json' }, function (err) {
    if (err) return fn && fn(err);
    trie.add(hash, fn);
  });
};

Places.prototype.createReadStream = function (lat, lon, opts) {
  var data = this.data;
  var search = this.trie.createSearchStream(geohash(lat, lon), opts)
  var get = ordered(function (str, cb) {
    data.get(str, { valueEncoding: 'json' }, cb);
  });
  
  return search.pipe(get);
};

