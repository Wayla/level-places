var level = require('level-test')({ mem: true });
var Places = require('..');
var test = require('tape');
var through = require('through');

test('nearby shorthand', function (t) {
  t.plan(1);
  var places = Places(level());

  places.add('New York', 40.7142, -74.0064);
  places.add('Kaufbeuren', 47.8800, 10.6225);

  var res = [];
  places.createReadStream({ latitude: 47.8838, longitude: 10.6171 })
    .pipe(through(write, end));

  function write (place) { res.push(place) }
  function end () { t.deepEqual(res, ['Kaufbeuren', 'New York']) }
});
