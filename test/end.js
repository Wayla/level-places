var level = require('level-test')({ mem: true });
var Places = require('..');
var test = require('tape');
var through = require('through');

test('end', function (t) {
  t.plan(1);
  var places = Places(level());

  places.add('Kaufbeuren', 47.8800, 10.6225);
  places.add('New York', 40.7142, -74.0064);

  var res = [];
  var rs = places.createReadStream(47.8838, 10.6171);
  rs.pipe(through(write, end));

  function write (place) {
    res.push(place);
    rs.end();
  }
  function end () { t.deepEqual(res, ['Kaufbeuren']) }
});
