var Youtube = require('youtube-api');
var config = require('config');
var Snoocore = require('snoocore');

var reddit = new Snoocore({
  userAgent: 'GradeAUpdater v1.0.0 by /u/demipixel for /u/GradeABelowA',
  oauth: {
    type: 'script',
    key: config.get('reddit.key'),
    secret: config.get('reddit.secret'),
    username: config.get('reddit.username'),
    password: config.get('reddit.password'),
    scope: ['submit']
  }
});

var auth = Youtube.authenticate({
    type: "key"
  , key: config.get('key')
});

var lastChecked = '';

setInterval(() => {
  Youtube.search.list({
    part: 'snippet',
    channelId: 'UCz7iJPVTBGX6DNO1RNI2Fcg',
    order: 'date'
  }, (err, data) => {
    if (err) console.log('[ERROR]',err);
    else checkData(data.items);
  });
}, 5 * 1000);

function checkData(data) {
  if (data[0].etag == lastChecked) return;
  var time = (new Date(data[0].snippet.publishedAt)).getTime();
  if (Date.now() - time < 1000*60) { // Last minute
    lastChecked = data[0].etag;
    if (data[0].snippet.liveBroadcastContent != 'none') return;
    post(config.get('reddit.sub'), 'https://www.youtube.com/watch?v=' + data[0].id.videoId, data[0].snippet.title + ' - GradeAUnderA');
  }
}


function post(sub, url, title) {
  console.log('Posting to /r/' + sub + ' "'+title+'": ' + url);
  reddit('/api/submit').post({
    api_type: 'json',
    kind: 'link',
    url: url,
    sr: sub,
    title: title
  }).then((resp) => {
    resp = resp.json;
    if (resp.errors.length) console.log('[REDDIT ERROR]',resp.errors);
    console.log('Successfully posted!',resp.data.url);
  }).catch((err) => console.log('[REDDIT ERROR]',err.message));
}