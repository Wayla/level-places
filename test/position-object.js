var level = require('level-test')({ mem: true });
var Places = require('..');
var test = require('tape');
var through = require('through');

test('position object', function (t) {
  t.plan(1);
  var places = Places(level());

  places.add('New York', { lat: 40.7142, lon: -74.0064 });
  places.add('Kaufbeuren', { latitude: 47.8800, longitude: 10.6225 });

  var res = [];
  places.createReadStream(47.8838, 10.6171)
    .pipe(through(write, end));

  function write (place) { res.push(place) }
  function end () { t.deepEqual(res, ['Kaufbeuren', 'New York']) }
});
