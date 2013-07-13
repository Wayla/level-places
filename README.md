
# level-places

Store and retrieve places near a lat/long pair, using
[leveldb](https://github.com/rvagg/node-levelup).

[![build status](https://secure.travis-ci.org/Wayla/level-places.png)](http://travis-ci.org/Wayla/level-places)

## Usage

Given a location, get all the nearby places, starting with the nearest one:

```js
var level = require('level');
var Places = require('level-places');

var places = Places(level(__dirname + '/db'));

places.add('Kaufbeuren', 47.8800, 10.6225);
places.add('New York', 40.7142, -74.0064);

places.createReadStream(47.8838, 10.6171, { limit: 1 })
  .on('data', console.log);
  // => "Kaufbeuren"
```

## How it works

Lat/long pairs are serialized into
[geohashes](http://en.wikipedia.org/wiki/Geohash). The geohash for
`(47.8800, 10.6225)` for example is `u0x83sr14nyj`. In order to query places
efficiently this makes use of the fact that geohashes of geographically
adjacent places start with the same characters, so they sort well.

When finding places near `(47.8800, 10.6225)`/`u0x83sr14nyj`, `level-places` queries
its database using those queues one after another:

* `u0x83sr14nyj`
* `u0x83sr14ny`
* `u0x83sr14n`
* `u0x83sr14`
* `u0x83sr1`
* `u0x83sr`
* `u0x83s`
* `u0x8`
* `u0x`
* `u0`
* `u`
* ``

Additionally a random string is appended to allow multiple places per key.

Every place that is found and hasn't already been emitted will be. So, places
are stored redundantly under those segments of their geohash. When a limit
is given and it is reached, or you call `stream.end()`, `level-store` stops
going further down the list.

## API

### Places(db)

Return a `level-places` instance that uses `db` for its storage, which needs
to be an instance of [levelup](https://github.com/rvagg/node-levelup).

If you want to store other data in `db`, use
[level-sublevel](https://github.com/dominictarr/level-sublevel) to pass a
subsection of your database.

### Places#add(place, latitude, longitude[, fn])

Add `place` to the given lat/long pair. `place` can be of any type that
`JSON.stringify` accepts. Optionally call `fn` as soon as the place was
saved to the db.

### Places#createReadStream(latitude, longitude[, options])

Create a readable stream that emits places around the provided lat/long pair,
starting with the nearest one.

Possible options are:

* limit: Limit the result set to x places.

## Installation

With [npm](http://npmjs.org) do

```bash
$ npm install level-places
```

## License

Copyright (c) 2013 Julian Gruber &lt;julian@wayla.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
