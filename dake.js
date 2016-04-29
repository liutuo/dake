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

var operation = {
    SIGN_IN: "syussya",
    SIGN_OUT: "taisya"
};

var createStringData = function(opVal) {
    var data = {
        dakoku: opVal,
        timezone: 480,
        user_id: args[0],
        password: args[1]
    };
    return querystring.stringify(data);
};

var createOptions = function(submitData) {
    return {
        hostname: 'ckip.worksap.co.jp',
        port: 443,
        path: '/cws/cws/srwtimerec',
        method: 'POST',
        headers: {
            'Origin': 'https://ckip.worksap.co.jp',
            'Host': 'ckip.worksap.co.jp',
            'Referer': 'https://ckip.worksap.co.jp/cws/cws/srwtimerec',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(submitData)
        }
    };
};

var sendRequest = function (options, data, logContent) {
    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        if (res.statusCode == 200) {
            console.log(logContent);
        }
    });
    req.write(data);
    req.end();
};

var printCurrentTime = function () {
    var now = moment()
    var formatted = now.format('YYYY-MM-DD HH:mm:ss Z')
    console.log(formatted)
};

// 0 - 10 minutes random offset
var randomOffset = function () {
    return Math.round(Math.random() * 10 * 60);
};

var createWeekdayRule = function(hour, min) {
    //every monday to friday
    var weekdayRange = new schedule.Range(1, 5);
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [weekdayRange];
    rule.hour = hour;
    rule.minute = min;
    return rule;
};

var scheduledJobCallback = function(sendRequestCallback) {
    sleep.sleep(randomOffset());
    console.log('Today you are protected by the Dake.js');
    printCurrentTime();
    sendRequestCallback();
};

var scheduledSignInCallback = function() {
    scheduledJobCallback(function() {
        var signInData = createStringData(operation.SIGN_IN);
        var signInOptions = createOptions(signInData);
        sendRequest(signInOptions, signInData, "出社打刻成功");
    });
};

var scheduledSignOutCallback = function() {
    scheduledJobCallback(function() {
        var signOutData = createStringData(operation.SIGN_OUT);
        var signOutOptions = createOptions(signOutData);
        sendRequest(signOutOptions, signOutData, "退社打刻成功");
    });
};

var signInRule = createWeekdayRule(10, 00);
var signOutRule = createWeekdayRule(19, 30);
var signInJob = schedule.scheduleJob(signInRule, scheduledSignInCallback);
var signOutJob = schedule.scheduleJob(signOutRule, scheduledSignOutCallback);
console.log("Dake Job Scheduled for " + args[0] + "!!");
