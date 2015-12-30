var Youtube = require('youtube-api');
var config = require('config');
var Snoocore = require('snoocore');
var moment = require('moment');

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

var lastChecked = null;
var lastPublished = '';

setInterval(() => {
  Youtube.activities.list({
    part: 'snippet',
    channelId: 'UCz7iJPVTBGX6DNO1RNI2Fcg'
  }, (err, data) => {
    if (err) console.log('[ERROR]',err);
    else checkData(data.items, data);
  });
}, 5 * 1000);

setInterval(() => {
  if (!lastPublished) return;
  console.log(moment().format('lll') + '] Last video posted ' + lastPublished.fromNow());
}, 30 * 1000);

function checkData(data, log) {
  if (!data) {
    console.log('Invalid data!',data,'then',log,'End of invalid data!');
    return;
  } else if (!data[0]) return;
  if (data[0].snippet.type != 'upload') return;
  if (data[0].snippet.publishedAt == lastChecked) return;
  var time = (new Date(data[0].snippet.publishedAt)).getTime();
  lastPublished = moment(data[0].snippet.publishedAt);
  if (Date.now() - time < 1000*60*5) { // Last 5 minutes
    console.log('FOUND!!');
    lastChecked = data[0].snippet.publishedAt;
    if (data[0].snippet.liveBroadcastContent != 'none' && typeof data[0].snippet.liveBroadcastContent != 'undefined') return;
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

console.log('Started...');