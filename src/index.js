'use strict';

/**
 * usage: npm start [accessToken] [debug] [privacy]
 */

var fb = require('./fb');
var exec = require('child_process').exec;

var parameter = process.argv.slice(2);

if (parameter.length < 1) {
  // --- Bad Input ---
  throw new Error('FB_ACCESS_TOKEN not given! usage: npm start [accessToken] [debug]');
}

var accessToken = parameter[0];
var debug = parameter[1] === 'true';
var privacy = parameter[2];

var postId;
var streamProcess;

function start() {
  // modify the options object to configure your stream
  // see: https://developers.facebook.com/docs/graph-api/reference/live-video/#Overview
  // for parameters,
  // privacy:
  // https://developers.facebook.com/docs/graph-api/reference/v2.8/post
  // 10211042370397464?privacy={'value':'EVERYONE'}
  var privacys = {
    public: "{'value':'EVERYONE'}",
    friends: "{'value':'ALL_FRIENDS'}",
    friends_of_friends: "{'value':'FRIENDS_OF_FRIENDS'}"
  };
  fb.startLiveVideo({
    accessToken,
    title: 'Live Video',
    // privacy: "{'value':'EVERYONE'}"
    // privacy: "{'value':'FRIENDS'}"
    privacy: privacys[privacy] || "{'value':'CUSTOM',allow:'100009508046151,1751806573'}",
  })
    .then((liveVideo) => {
      console.log(liveVideo);

      var rtmpUrl = liveVideo.stream_url;
      postId = liveVideo.id;

      var url = 'file://' + __dirname + '/../website/index.html?debug=' + debug + '&accessToken=' + accessToken + '&postId=' + postId;
      var fps = 30; // must be the same as in scraper.js
      var cmd;
      // write to file:
      // cmd = 'phantomjs --web-security=no ' + __dirname + '/scraper.js "' + url + '" | ffmpeg -y -c:v png -f image2pipe -r ' + fps + ' -t 10 -i - -c:v libx264 -pix_fmt yuv420p -movflags +faststart result/html.mp4 >> stream.log 2>&1';
      // cmd = 'phantomjs --web-security=no ' + __dirname + '/scraper.js "http://lmgtfy.com/?q=test" | ffmpeg -y -c:v png -f image2pipe -r ' + fps + ' -t 10 -i - -c:v libx264 -pix_fmt yuv420p -movflags +faststart result/html.mp4 >> stream.log 2>&1';

      // stream to facebook; -s size should be the same as in scraper.js
      // TODO: ffmpeg is drops down to ~11fps and is not keeping the 30fps (facebooks minimum fps to show the video)
      cmd = 'phantomjs --web-security=no ' + __dirname + '/scraper.js "' + url + '" ' +
        // '| ffmpeg -y -c:v png -f image2pipe -r ' + fps + ' -i - -c:v libx264 -s 1280x720 -pix_fmt yuv420p -r ' + fps + ' -f flv "' + rtmpUrl + '" >> stream.log 2>&1';
        // '| ffmpeg -y -c:v png -f image2pipe -i - -c:v libx264 -s 1280x720 -pix_fmt yuv420p -vf "fps=30" -f flv "' + rtmpUrl + '" >> stream.log 2>&1';
        // '| ffmpeg -y -c:v png -f image2pipe -i - -c:v libx264 -pix_fmt yuv420p -vf "fps=30" -f flv "' + rtmpUrl + '" >> stream.log 2>&1';
        '| ffmpeg -threads 0 -y -v verbose -c:v png -r ' + fps + ' -f image2pipe -i - -f lavfi -i anullsrc -acodec aac -ac 1 -ar 44100 -b:a 128k -c:v libx264 -s 1280x720 -pix_fmt yuv420p -f flv "' + rtmpUrl + '" >> stream.log 2>&1';
      // '| ffmpeg -y -c:v png -f image2pipe -r ' + fps + ' -i - -b 4000k -minrate 4000k -maxrate 4000k -bufsize 1835k -c:v libx264 -s 1280x720 -pix_fmt yuv420p -f flv "' + rtmpUrl + '" >> stream.log 2>&1';
      // ^^^^
      // worse tests:
      // cmd = 'phantomjs --web-security=no scraper.js "' + url + '" | ffmpeg -y -c:v png -f image2pipe -r ' + fps + ' -i - -c:v libx264 -profile:v baseline -maxfps 200000 -bufsize 200000 -level 3.1 -pix_fmt yuv420p -f flv "' + rtmpUrl + '" >> stream.log 2>&1';
      // cmd = 'phantomjs --web-security=no scraper.js "' + url + '" | ffmpeg -y -c:v png -f image2pipe -r ' + fps + ' -i - -c:v libx264 -pix_fmt yuv420p -f flv "' + rtmpUrl + '" >> stream.log 2>&1';
      // cmd = 'phantomjs --web-security=no ' + __dirname + '/scraper.js "' + url + '" | ffmpeg -y -c:v png -f image2pipe -r ' + fps + ' -i - -c:v libx264 -s 960x540 -pix_fmt yuv420p -f flv "' + rtmpUrl + '" >> stream.log 2>&1';

      console.log('\n');
      console.log('cmd:', cmd);
      console.log('\n');

      streamProcess = exec(cmd, (error, stdout, stderr) => {
        // command output is in stdout
        console.log({ stderr });
        if (error) throw error;
      });
    })
    .catch((error) => {
      console.error(error.message, error.options);
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
