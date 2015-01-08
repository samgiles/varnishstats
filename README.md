# Varnish Stats

Collect statistics about varnish requests.

## Usage

```JS
var varnishstats = require('varnishstats');

var stats = varnishstats();

stats.on('request', function(requestInfo) {
	console.log("Request URL: ", requestInfo.requestUrl);
	console.log("Response status: ", requestInfo.status);
	console.log("Total size of response in bytes: ", requestInfo.bytes);
	console.log("Total request/response time in microseconds: ", requestInfo.time);
});
```

## API

By requiring 'varnishstats' you get a function that will start listening to
`varnishncsa`.

You can then subscribe to the `request` event using the `on` method of the
returned object.

### License

MIT
