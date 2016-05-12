var querystring = require('querystring');
var https = require('https');
var schedule = require('node-schedule');
var moment = require('moment');
var sleep = require('sleep');
var getopt = require('node-getopt');
var ical = require('ical');
var holidays = {};

var parameters = getopt.create([
    ['u', 'username=[ARG]', 'username, required argument'],
    ['p', 'password=[ARG]', 'password, required argument'],
    ['t', 'testing', 'testing mode, no actual request is sent'],
    ['h', 'help', 'show help message']
]).bindHelp();

var operations = {
    SIGN_IN: 'syussya',
    SIGN_OUT: 'taisya'
};

var HOLIDAY_DIR = 'holidays/';
var HOLIDAY_DOWNLOAD_BASE_URL = 'http://www.mom.gov.sg/employment-practices/public-holidays/';

function isTestingMode() {
    if (args === undefined) {
        return false;
    } else if (args['testing']) {
        return true;
    } else {
        return false;
    }
}

// core method, send a https request to check-in.
function sendRequest(args, operation, callback) {
    var body = querystring.stringify({
        dakoku: operation,
        timezone: 480,
        user_id: args['username'],
        password: args['password']
    });
    var option = {
        hostname: 'ckip.worksap.co.jp',
        port: 443,
        path: '/cws/cws/srwtimerec',
        method: 'POST',
        headers: {
            'Origin': 'https://ckip.worksap.co.jp',
            'Host': 'ckip.worksap.co.jp',
            'Referer': 'https://ckip.worskap.co.jp/cws/cws/srwtimerec',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    if (isTestingMode()) {
        console.info('Testing mode: print out http request instead of sending.');
        console.info(option);
        console.info(body);
    } else {
        var request = https.request(option, callback);
        request.write(body);
        request.end();
    }
}

// print out some logs according to the http response.
function responseCallback(message) {
    return function (res) {
        var dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        if (res.statusCode == 200) {
            console.log(dateTime + ' | Response Code 200: ' + message);
            console.log(dateTime + " | You're again protected by Dake.js today.");
        } else {
            console.log(dateTime + ' | Response Code ' + res.statusCode + ': ' + res.statusMessage);
            console.log(dateTime + " | Sorry, you're out of luck today.");
        }
    };
}

function loadPublicHoliday(file) {
    var holidayIcs = {};
    try {
        console.log('Loading holiday file: ' + file);
        holidayIcs = ical.parseFile(file);
    } catch (err) {
        console.error('Event file for public holidays in the year of ' + currentYear + ' cannot be found.');
        console.error('Please download it from ' + HOLIDAY_DOWNLOAD_BASE_URL);
        process.exit(0);
    }

    if (isTestingMode()) {
        console.log(holidayIcs);
    }

    for (var k in holidayIcs) {
        var holiday = moment(holidayIcs[k].start)
        holidays[holiday.format('YYYY-MM-DD')] = holidayIcs[k].summary;
    }
}

function makeHolidayFileName() {
    var currentYear = moment().year();
    var HOLIDAY_FILE_PREFIX = 'public-holidays-sg-';
    return HOLIDAY_FILE_PREFIX + currentYear + '.ics';
}

// helper function: check if today is holiday, can only detect fixed holiday currently.
function checkHolidays(dateTime) {
    var dateString = dateTime.format('YYYY-MM-DD');
    var day = holidays[dateString];
    if (day) {
        console.log(dateTime.format('YYYY-MM-DD HH:mm:ss') + ' | Today is ' + day + ', have a nice day');
        return true;
    }
    return false;
}

// helper function: return a random number of seconds.
function randomSeconds(args) {
    if (isTestingMode()) {
        return 1;
    }
    return Math.round(Math.random() * 10 * 60);
}

// parsing arguments.
var opts = parameters.parseSystem();
var args = opts.options;

// recognize the first two unnamed args as username and password.
if (opts.argv.length == 2) {
    args['username'] = opts.argv[0];
    args['password'] = opts.argv[1];
}

// exit if required args are not provided.
if (!args['username'] || !args['password']) {
    parameters.showHelp();
    process.exit(0);
}

loadPublicHoliday(HOLIDAY_DIR + makeHolidayFileName());

// schedule check-in on Monday to Friday 1000.
schedule.scheduleJob('0 0 10 * * 1-5', function () {
    if (!checkHolidays(moment())) {
        sleep.sleep(randomSeconds(args));
        sendRequest(args, operations.SIGN_IN, responseCallback('出社打刻成功'));
    }
});

// schedule check-out on Monday to Friday 1930.
schedule.scheduleJob('0 30 19 * * 1-5', function () {
    if (!checkHolidays(moment())) {
        sleep.sleep(randomSeconds(args));
        sendRequest(args, operations.SIGN_OUT, responseCallback('退社打刻成功'));
    }
});

console.log("Dake job scheduled for " + args['username'] + '!');
