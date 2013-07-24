var level = require('level-test')({ mem: true });
var Places = require('..');
var test = require('tape');
var through = require('through');

test('nearby places', function (t) {
  t.plan(2);
  var places = Places(level());

  places.add('New York', 40.7142, -74.0064);

  var rs = places.createReadStream(47.8838, 10.6171, { follow: true });

  rs.once('data', function (place) {
    t.equal(place, 'New York');
    places.add('Kaufbeuren', 47.8800, 10.6225);

    rs.once('data', function (place) {
      t.equal(place, 'Kaufbeuren');
    });
  });
});
