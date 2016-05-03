var querystring = require('querystring');
var https       = require('https');
var schedule    = require('node-schedule');
var moment      = require('moment');
var sleep       = require('sleep');
var getopt      = require('node-getopt');


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

var fixedHolidays = {
   '01-01': 'new year',
   '05-01': 'labour day',
   '08-09': 'national day',
   '12-25': 'christmas'
};

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
      port:     443,
      path:     '/cws/cws/srwtimerec',
      method:   'POST',
      headers:  {
         'Origin':      'https://ckip.worksap.co.jp',
         'Host':        'ckip.worksap.co.jp',
         'Referer':     'https://ckip.worskap.co.jp/cws/cws/srwtimerec',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Length': Buffer.byteLength(body)
      }
   };
         
   if (args['testing']) {
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
   return function(res) {
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

// helper function: check if today is holiday, can only detect fixed holiday currently.
function checkHoliday(dateTime) {
   var dateString = dateTime.format('MM-DD');
   var day = fixedHolidays[dateString];
   if (day) {
      console.log(dateTime.format('YYYY-MM-DD HH:mm:ss') + ' | Today is ' + day + ', have a nice day');
      return true;
   }
   return false;
}

// helper function: return a random number of seconds.
function randomSeconds(args) {
   if (args['testing']) {
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

// schedule check-in on Monday to Friday 1000.
schedule.scheduleJob('0 0 10 * * 1-5', function() {
   if (!checkHoliday(moment())) {
      sleep.sleep(randomSeconds(args));
      sendRequest(args, operations.SIGN_IN, responseCallback('出社打刻成功'));
   }
});

// schedule check-out on Monday to Friday 1930.
schedule.scheduleJob('0 30 19 * * 1-5', function() {
   if (!checkHolday(moment())) {
      sleep.sleep(randomSeconds(args));
      sendRequest(args, operations.SIGN_OUT, responseCallback('退社打刻成功'));
   }
});

console.log("Dake job scheduled for " + args['username'] + '!!');
