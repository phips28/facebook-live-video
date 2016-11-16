'use strict';

const rp = require('request-promise');
const Promise = require('bluebird');

/**
 * @param options { accessToken }
 * @returns Promise
 */
exports.startLiveVideo = function startLiveVideo(options) {
  return rp({
    uri: 'https://graph.facebook.com/v2.8/me/live_videos'
    + '?access_token=' + options.accessToken,
    method: 'POST',
    json: options,
  })
    .then((response) => {
      return exports.getLiveVideo({ accessToken: options.accessToken, postId: response.id })
    });
};

/**
 * @param options { accessToken, postId }
 * @returns Promise
 */
exports.getLiveVideo = function getLiveVideo(options) {
  return rp({
    uri: 'https://graph.facebook.com/v2.8/' + options.postId
    + '?access_token=' + options.accessToken,
    method: 'GET',
    json: true
  });
};

/**
 * @param options { accessToken, postId }
 * @returns Promise
 */
exports.deleteLiveVideo = function deleteLiveVideo(options) {
  return rp({
    uri: 'https://graph.facebook.com/v2.8/' + options.postId
    + '?access_token=' + options.accessToken,
    method: 'DELETE',
    json: true
  });
};

/**
 * @param options { accessToken, postId }
 * @returns Promise
 */
exports.endLiveVideo = function endLiveVideo(options) {
  return rp({
    uri: 'https://graph.facebook.com/v2.8/' + options.postId
    + '?end_live_video=true'
    + '&access_token=' + options.accessToken,
    method: 'POST',
    json: true
  });
};

/**
 * @param options { accessToken }
 * @returns Promise
 */
exports.getAllLiveVideos = function getAllLiveVideos(options) {
  return rp({
    uri: 'https://graph.facebook.com/v2.8/me/live_videos'
    + '?access_token=' + options.accessToken,
    method: 'GET',
    json: true
  });
};

/**
 * CLI usage
 * node src/fb.js [accessToken] [action] [postId]
 * node src/fb.js [accessToken] get 1234
 * node src/fb.js [accessToken] end 1234
 * node src/fb.js [accessToken] delete 1234
 * node src/fb.js [accessToken] get_all
 * node src/fb.js [accessToken] delete_all
 */
const parameter = process.argv.slice(2);
if (parameter.length === 2 || parameter.length === 3) {
  switch (parameter[1]) {
    case 'get':
      exports.getLiveVideo({ accessToken: parameter[0], postId: parameter[2] })
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.error(error.message);
        });
      break;
    case 'end':
      exports.endLiveVideo({ accessToken: parameter[0], postId: parameter[2] })
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.error(error.message);
        });
      break;
    case 'delete':
      exports.deleteLiveVideo({ accessToken: parameter[0], postId: parameter[2] })
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.error(error.message);
        });
      break;
    case 'get_all':
      exports.getAllLiveVideos({ accessToken: parameter[0] })
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.error(error.message);
        });
      break;
    case 'delete_all':
      exports.getAllLiveVideos({ accessToken: parameter[0] })
        .then((response) => {
          console.log('deleting', response.data.length, 'videos');
          return Promise.map(response.data,
            (video) => exports.deleteLiveVideo({ accessToken: parameter[0], postId: video.id }))
            .then((responses) => {
              console.log(responses);
            })
        })
        .catch((error) => {
          console.error(error.message);
        });
      break;
  }
}
