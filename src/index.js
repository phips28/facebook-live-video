'use strict';

/**
 * usage: npm start [accessToken] [debug]
 */

var fb = require('./fb');
var exec = require('child_process').exec;

var parameter = process.argv.slice(2);

if (parameter.length < 1) {
  // --- Bad Input ---
  throw new Error('FB_ACCESS_TOKEN not given! usage: npm start [accessToken] [debug]');
}

var accessToken = parameter[0];
var debug = parameter[1];

var postId;
var streamProcess;

function start() {
  // privacy:
  // https://developers.facebook.com/docs/graph-api/reference/v2.8/post
  // 10211042370397464?privacy={'value':'EVERYONE'}
  fb.startLiveVideo({
    accessToken,
    title: 'First test video - ' + new Date(),
    // privacy: "{'value':'EVERYONE'}"
    // privacy: "{'value':'FRIENDS'}"
    privacy: "{'value':'CUSTOM',allow:'100009508046151,1751806573'}",
  })
    .then((liveVideo) => {
      console.log(liveVideo);

      var rtmpUrl = liveVideo.stream_url;
      postId = liveVideo.id;

      // var url = 'http://localhost/dvel/dvel-livestream/website/index.html?debug=true&accessToken=' + accessToken + '&postId=' + postId;
      var url = 'file://' + __dirname + '/../website/index.html?debug=' + !!debug + '&accessToken=' + accessToken + '&postId=' + postId;
      var fps = 10; // must be the same as in scraper.js
      var cmd;
      // write to file:
      // cmd = 'phantomjs ' + __dirname + '/scraper.js "http://lmgtfy.com/?q=test" | ffmpeg -y -c:v png -f image2pipe -r ' + rate + ' -t 10 -i - -c:v libx264 -pix_fmt yuv420p -movflags +faststart result/html.mp4 >> stream.log';
      // cmd = 'phantomjs ' + __dirname + '/scraper.js "' + url + '" | ffmpeg -y -c:v png -f image2pipe -r ' + rate + ' -t 10 -i - -c:v libx264 -pix_fmt yuv420p -movflags +faststart result/html.mp4 >> stream.log';

      // stream to facebook; -s size should be the same as in scraper.js
      cmd = 'phantomjs ' + __dirname + '/scraper.js "' + url + '" | ffmpeg -y -c:v png -f image2pipe -r ' + fps + ' -i - -c:v libx264 -s 1280x720 -pix_fmt yuv420p -f flv "' + rtmpUrl + '" >> stream.log';
      // ^^^^
      // worse tests:
      // cmd = 'phantomjs scraper.js "' + url + '" | ffmpeg -y -c:v png -f image2pipe -r ' + rate + ' -i - -c:v libx264 -profile:v baseline -maxrate 200000 -bufsize 200000 -level 3.1 -pix_fmt yuv420p -f flv "' + rtmpUrl + '" >> stream.log';
      // cmd = 'phantomjs scraper.js "' + url + '" | ffmpeg -y -c:v png -f image2pipe -r ' + rate + ' -i - -c:v libx264 -pix_fmt yuv420p -f flv "' + rtmpUrl + '" >> stream.log';
      // cmd = 'phantomjs ' + __dirname + '/scraper.js "' + url + '" | ffmpeg -y -c:v png -f image2pipe -r ' + rate + ' -i - -c:v libx264 -s 960x540 -pix_fmt yuv420p -f flv "' + rtmpUrl + '" >> stream.log';

      console.log('\n');
      console.log('cmd:', cmd);
      console.log('\n');

      streamProcess = exec(cmd, (error, stdout, stderr) => {
        // command output is in stdout
        console.log({ error, stderr });
        if (error) throw error;
      });
    })
    .catch((error) => {
      console.error(error.message);
    });
}

function exitHandler(options, err) {
  if (options.cleanup) {
    if (streamProcess) {
      streamProcess.kill('SIGINT');
    }
    if (accessToken && postId) {
      fb.endLiveVideo({ accessToken, postId });
      // fb.deleteLiveVideo({ accessToken, postId });
    }
  }
  if (err) console.error(err.stack);
  if (options.exit) process.exit();
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

start();
