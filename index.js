var Youtube = require('youtube-api');
var config = require('config');
var Snoocore = require('snoocore');
var moment = require('moment');
var request = require('request');

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

var channelList = config.get('channels');

var lastChecked = [];
lastChecked = channelList.map(i => null);

channelList.forEach((c, index) => {
  if (!c.sub && !config.get('defaultSub')) console.log('Cannot start '+c.name+' - No sub assigned and no default sub!');
  else checkChannel(c, index);
});


function checkChannel(channel, index) {
  Youtube.activities.list({
    part: 'snippet',
    channelId: channel.id
  }, (err, data) => {
    if (!err) {
      checkData(data.items, data, channel.name, channel.sub || config.get('defaultSub'), index);
    } else {
      if (err.code != 'ENOTFOUND' && err.code != 503 && err.code != 'EAI_AGAIN') {
        console.log(JSON.stringify(err));
      }
    }
    setTimeout(()=>checkChannel(channel, index),3000);
  });
}

function checkData(data, log, channelName, subreddit, channelIndex) {
  if (!data) {
    console.log('Invalid data!',data,'then',log,'End of invalid data!');
    return;
  } else if (!data[0]) return;
  if (data[0].snippet.type != 'upload') return;
  if (data[0].snippet.publishedAt == lastChecked[channelIndex]) return;
  var time = (new Date(data[0].snippet.publishedAt)).getTime();
  if (Date.now() - time < 1000*60*5) { // Last 5 minutes
    lastChecked[channelIndex] = data[0].snippet.publishedAt;
    if (data[0].snippet.liveBroadcastContent != 'none' && typeof data[0].snippet.liveBroadcastContent != 'undefined') return;
    var id = data[0].snippet.thumbnails.default.url.match(/\/vi\/(.*?)\//i);
    if (!id) {
      console.log('Invalid ID!');
      console.log(data[0]);
      return;
    } else {
      id = id[1];
    }
    post(subreddit, 'https://www.youtube.com/watch?v=' + id, data[0].snippet.title + ' ('+channelName+')');
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
    else {
      console.log('Successfully posted!',resp.data.url);
      if (config.get('textnumber')) {
        request.post('http://textbelt.com/text', { form: { number: config.get('textnumber'), message: resp.data.url }});
      }
    }
  }).catch((err) => console.log('[REDDIT ERROR]',err.message));
}

console.log('Started...');