var level = require('level-test')({ mem: true });
var Places = require('..');
var test = require('tape');
var through = require('through');

test('with position', function (t) {
  t.plan(5);
  var places = Places(level());

  places.add('Kaufbeuren', 47.8800, 10.6225);
  places.add('New York', 40.7142, -74.0064);

  var res = [];
  places.createReadStream(47.8838, 10.6171, { position: true })
    .pipe(through(write, end));

  function write (place) { res.push(place) }
  function end () {
    t.equal(res.length, 2);
    t.equal(res[0].name, 'Kaufbeuren');
    t.ok(near(res[0].position, {
      latitude: 47.8800,
      longitude: 10.6225
    }));
    t.equal(res[1].name, 'New York');
    t.ok(near(res[1].position, {
      latitude: 40.7142,
      longitude: -74.0064
    }));
  }
});

function near (obj, res) {
  var keys = Object.keys(res);
  for (var i = 0; i < keys.length; i++) {
    var a = obj[keys[i]];
    var b = res[keys[i]];
    if (!similar(a, b)) return false;
  }
  return true;
}

function similar (a, b) {
  return Math.abs(a - b) < 0.000001;
}
