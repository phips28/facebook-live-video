/**
 * execute with `phantomjs scraper.js [url]`
 * http://mindthecode.com/recording-a-website-with-phantomjs-and-ffmpeg/
 */
var system = require('system');
var args = system.args;
var url;
var fps = 30; // must be the same as in index.js

if (args[1]) {
  url = args[1];
} else {
  throw new Error('scraper: url is missing! usage: phantomjs scraper.js [url]');
  phantom.exit();
}

var page = require('webpage').create();
page.viewportSize = { width: 1280, height: 720 };

page.open(url, function () {
  setInterval(function () {
    page.render('/dev/stdout', { format: 'png' });
  }, 1000 / fps);
});
