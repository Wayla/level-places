var level = require('level-test')({ mem: true });
var Places = require('..');
var test = require('tape');
var through = require('through');
var equal = require('deep-equal');

test('remove by position', function (t) {
  t.plan(3);
  var places = Places(level());

  places.add({ name: 'Kaufbeuren' }, 47.8800, 10.6225);
  places.createReadStream(47.8838, 10.6171).on('data', function (place) {
    t.ok(equal(place, { name: 'Kaufbeuren' }));
    places.remove({ name: 'Kaufbeuren' }, 47.8800, 10.6225, function (err) {
      t.error(err);
      places.createReadStream(47.8838, 10.6171)
        .on('data', t.fail.bind(t))
        .on('end', t.pass.bind(t))
    });
  });
});
