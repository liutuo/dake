var querystring = require('querystring');
var https = require('https');
var schedule = require('node-schedule');
var moment = require('moment');
var sleep = require('sleep');

var args = process.argv.slice(2);
if (args.length != 2) {
    console.log("Usage:\n   node dake.js [userId] [password]");
    process.exit(0);
}

var data = querystring.stringify({
  dakoku: 'syussya',
  timezone: 480,
  user_id: args[0],
  password: args[1],
});

var options = {
  hostname: 'ckip.worksap.co.jp',
  port: 443,
  path: '/cws/cws/srwtimerec',
  method: 'POST',
  headers: {
    'Origin': 'https://ckip.worksap.co.jp',
    'Host': 'ckip.worksap.co.jp',
    'Referer': 'https://ckip.worksap.co.jp/cws/cws/srwtimerec',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(data)
  }
};

var req = https.request(options, function(res) {
  res.setEncoding('utf8');
    if (res.statusCode == 200) {
        console.log("打卡成功");
    }

});
var sendRequest = function() {
    req.write(data);
    req.end();
}

var getCurrentTime = function() {
    var now = moment()
    var formatted = now.format('YYYY-MM-DD HH:mm:ss Z')
    console.log(formatted)
}

// 0 - 10 minutes random offset
var randomOffset = function() {
    return Math.round(Math.random()*10*60);
}

var rule = new schedule.RecurrenceRule();
//every monday to friday
rule.dayOfWeek = [new schedule.Range(1, 5)];
rule.hour = 14;
rule.minute = 38;

var schdeuledJob = schedule.scheduleJob(rule, function(){
    sleep.sleep(randomOffset())
    console.log('Today you are protected by the Dake.js');
    getCurrentTime();
    sendRequest();
});
console.log("Dake Job Scheduled for " + args[0] + "!!");