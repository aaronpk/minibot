process.chdir(__dirname);

var fs = require('fs');
var irc = require('irc');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var net = require('net'); 
var dgram = require('dgram');
var simplesmtp = require("simplesmtp");
var MailParser = require("mailparser").MailParser

function load_config(name) {
  return JSON.parse(fs.readFileSync(name, 'utf8'));
}

var cfg = load_config('./config.json');

var bot = new irc.Client(cfg.irc.hostname, cfg.irc.nick, cfg.irc);

bot.addListener('connect', function() {
  console.log('[irc] Connected as "'+bot.nick+'"');
});

bot.addListener('registered', function(message) {
  console.log('[irc] registered: ', message);
});

bot.addListener('error', function(message) {
  console.log('[irc] error: ', message);
});

/*
bot.addListener('ctcp', function(nick, to, text, type) {
  console.log('ctcp: ' + nick + ' said ' + text + ' (' + to + ')');
});

bot.addListener('message', function(nick, to, text, type) {
  console.log('message: ' + nick + ' said ' + text + ' (' + to + ')');
});
*/

/*
 * HTTP API
 */

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/raw', function(req, res) {
  if(req.body.access_token != cfg.http.token) {
    res.status(403).send('forbidden');
    return;
  }

  var args = req.body.command.split(" ");
  // console.log(args);
  bot.send.apply(this, args);
  res.status(202).send('ok');
});

app.post('/channel/:channel', function(req, res) {
  if(req.body.access_token != cfg.http.token) {
    res.status(403).send('forbidden');
    return;
  }

  console.log("[http] " + req.params.channel + ": " + req.body.content);
  bot.say(req.params.channel, req.body.content);
  res.status(202).send('ok');
});

app.post('/channel/:channel/errbit', function(req, res) {

  console.log("[errbit] " + req.params.channel + ": " + req.body.problem);
  var info = JSON.parse(req.body.problem);
  console.log(info);

  var message = "["+info.app_name+"] "+info.message;
  if(info.notices_count) {
    message += " ("+info.notices_count+")";
  }
  message += " "+cfg.errbitBase+"/apps/"+info.app_id+"/problems/"+info._id;

  bot.say("#"+req.params.channel, message);

  res.status(202).send('ok');
});

if(cfg.http) {
  app.listen(cfg.http.port);
  console.log("[http] Server listening on " + cfg.http.port);
}

/**
 * API Method to retrieve a list of nicks in a channel
 */
var openRequests = [];

app.get('/channel/:channel/nicks', function(req, res) {
  if(req.query.access_token != cfg.http.token) {
    res.status(403).send('forbidden');
    return;
  }

  openRequests.push(res);
  bot.send("NAMES", "#"+req.params.channel);
});

bot.addListener('names', function(channel, nicks) {
  // console.log("names: ", nicks);
  for(var i in openRequests) {
    openRequests[i].send(JSON.stringify({nicks: nicks}), 200);
  }
  openRequests = [];
});

/*
 * UDP Input
 */

var udpServers = {}

function setUpListener(channel, port) {
  udpServers[port] = dgram.createSocket("udp4");

  udpServers[port].on("message", function(buffer, rinfo) {
    process.stdout.write("[" + channel + "] " + rinfo.address + ":" + rinfo.port + " " + buffer + "\n");
    handleMessage("#"+channel, ""+buffer);
  });

  udpServers[port].on("listening", function() {
    var address = udpServers[port].address();
    console.log("[udp] Server listening on " + address.port + " for #" + channel);
  });

  udpServers[port].bind(port, '0.0.0.0');
}

function handleMessage(channel, message) {

  if(action = message.match(/^ACTION (.+)/)) {
    // console.log("ACTION "+action[1]);
    bot.action(channel, action[1]);

  } else if(priv = message.match(/^PRIV ([^ ]+) (.+)/)) {
    // console.log(message);
    bot.say(priv[1], priv[2]);

  } else if(topic = message.match(/^TOPIC (#[^ ]+) (.+)/)) {
    bot.send("TOPIC", topic[1], topic[2]);

  } else {
    bot.say(channel, message);
  }
}

// Set up the listeners for port-based messages.
// Clients can send a UDP packet to this port and it will be echoed into the 
// appropriate channel.
for(var port in cfg.udp) {
  var channel = cfg.udp[port];
  setUpListener(channel, port);
}


/*
 * SMTP
 */

if(cfg.smtp) {

  // Set up the SMTP server
  var smtp = simplesmtp.createServer({
      validateSender: false,
      disableDNSValidation: true,
      debug: false
  });
  smtp.listen(cfg.smtp.port);
  console.log("[smtp] Server listening on " + cfg.smtp.port);

  // Set up an event listener when the parsing finishes
  var mailparser_done = function(mail_object){
      console.log("[smtp] From:", mail_object.from); //[{address:'sender@example.com',name:'Sender Name'}]
      console.log("[smtp] To:", mail_object.to); //[{address:'sender@example.com',name:'Sender Name'}]
      console.log("[smtp] Subject:", mail_object.subject); // Hello world!

      // Determine the channel to deliver the message to
      var to_address;

      if(mail_object.to && mail_object.to[0]) {
          to_address = mail_object.to[0].address;
      } else {
          console.log("[smtp] Could not find a 'to' address:", mail_object);
          return;
      }

      var channel = "#" + to_address.match(/([^@]+)@/)[1];
      console.log("[smtp] Channel:", channel);

      var from;
      if(mail_object.from && mail_object.from[0] && mail_object.from[0].address) {
          from = mail_object.from[0].address;
      } else {
          from = "email";
      }

      bot.say(channel, "["+from+"] "+mail_object.subject);
  };

  // Initialize the MailParser object when a new email is received
  smtp.on("startData", function(envelope){
      envelope.saveStream = new MailParser();
      envelope.saveStream.on("end", mailparser_done);
  });

  // Write all data to the MailParser stream
  smtp.on("data", function(envelope, chunk){
      envelope.saveStream.write(chunk);
  });

  // After the email is finished, tell MailParser it's done
  smtp.on("dataReady", function(envelope, callback){
      envelope.saveStream.end();
      callback(null, "irc"); // This is the queue id to be advertised to the client
  });

}

