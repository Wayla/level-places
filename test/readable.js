var level = require('level-test')({ mem: true });
var Places = require('..');
var test = require('tape');

test('readable', function (t) {
  t.plan(2);
  var places = Places(level());
  var rs = places.createReadStream(47.8838, 10.6171);
  t.ok(rs.readable);
  t.notOk(rs.writable);
});
