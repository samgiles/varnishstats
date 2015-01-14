var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

function VarnishStats(varnishncsaProcess) {
	this.varnishncsa = varnishncsaProcess;
	var stats = this;

    function _onVarnishncsaData(data) {
		var parsedData = varnishncsaOutputParser(data);
		var requestTopLine = parsedData.request.split(/\s/);
		parsedData.method = requestTopLine[0];
		parsedData.requestUrl = requestTopLine[1];

		// HACK: There is a bug in varnishncsa: 304s are never logged
		// correctly.  If the Length is 0 and Response is 200 drop the request
		// from the logs so we don't log requests for things that are served from browser
		// cache. (https://www.varnish-cache.org/trac/ticket/1462) ??
		// Review;sg; not sure this is the right thing to do
		if (parsedData.status === 200 && parsedData.bytes === 0) {
			return;
		}

		stats.emit('request', parsedData);
	}

	this.varnishncsa.stdout.on('data', _onVarnishncsaData);

	this.varnishncsa.on('close', function (code) {
		this.emit('close', code);
	}.bind(this));

	// TODO: Do something with stderr
}

inherits(VarnishStats, EventEmitter);

function varnishncsaOutputParser(dataString) {
	// Strip out newlines
	var splitString = dataString.toString().split(' ! ').map(function cleanStrings(string) {
		return string.replace('\n', '');
	});

	return {
		"time": parseInt(splitString[0], 10),
		"bytes": parseInt(splitString[1], 10),
		"status": parseInt(splitString[2], 10),
		"request": splitString[3],
		"hitmiss": splitString[4]
	};
}

module.exports = function() {

	// Format as JSON
	// %D - Response time in microseconds
	// %b - Response bytes
	// %s - Response status
	// %r - Original request
	// %{Varnish:hitmiss}x  - Varnish 'hit' or 'miss'
	var _varnishncsaFormat = '%D ! %b ! %s ! %r ! %{Varnish:hitmiss}x';
    var varnishncsa = spawn("varnishncsa", ['-F', _varnishncsaFormat]);
	return new VarnishStats(varnishncsa);
};
