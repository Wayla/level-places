var level = require('level-test')({ mem: true });
var Places = require('..');

var places = Places(level(__dirname + '/db'));

places.add('Kaufbeuren', 47.8800, 10.6225);
places.add('New York', 40.7142, -74.0064);

places.createReadStream(47.8838, 10.6171, { limit: 1 })
  .on('data', console.log);
