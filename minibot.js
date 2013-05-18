process.chdir(__dirname);

var fs = require('fs');
var irc = require('irc');
var express = require('express');
var app = express();
var net = require('net'); 
var dgram = require('dgram');

function load_config(name) {
  return JSON.parse(fs.readFileSync(name, 'utf8'));
}

var cfg = load_config('./config.json');
var ports = cfg.udp;

var bot = new irc.Client(cfg.irc.hostname, cfg.irc.nick, cfg.irc);

bot.addListener('connect', function() {
  console.log('Connected as "'+bot.nick+'"');
});

bot.addListener('registered', function(message) {
  console.log('registered: ', message);
});

bot.addListener('error', function(message) {
  console.log('error: ', message);
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

app.use(express.bodyParser());

app.post('/raw', function(req, res) {
  if(req.body.token != cfg.http.token) {
    res.send('forbidden', 403);
    return;
  }

  var args = req.body.command.split(" ");
  console.log(args);
  bot.send.apply(this, args);
  res.send('ok', 200);
});

app.post('/channel/:channel', function(req, res) {
  if(req.body.token != cfg.http.token) {
    res.send('forbidden', 403);
    return;
  }

  console.log(req.params.channel + ": " + req.body.message);
  bot.say("#"+req.params.channel, req.body.message);
  res.send('ok', 200);
});

app.listen(cfg.http.port);


/**
 * API Method to retrieve a list of nicks in a channel
 */
var openRequests = [];

app.get('/channel/:channel/nicks', function(req, res) {
  if(req.query.token != cfg.http.token) {
    res.send('forbidden', 403);
    return;
  }

  openRequests.push(res);
  bot.send("NAMES", "#"+req.params.channel);
});

bot.addListener('names', function(channel, nicks) {
  console.log("names: ", nicks);
  for(var i in openRequests) {
    openRequests[i].send(JSON.stringify({nicks: nicks}), 200);
  }
  openRequests = [];
});

/*
 * UDP Input
 */

var udpServers = {}

// Set up the listeners for port-based messages.
// Clients can send a UDP packet to this port and it will be echoed into the 
// appropriate channel.
for(var port in ports) {
  var channel = ports[port];
  setUpListener(channel, port);
}

function setUpListener(channel, port) {
  udpServers[port] = dgram.createSocket("udp4");

  udpServers[port].on("message", function(buffer, rinfo) {
    process.stdout.write("[" + channel + "] " + rinfo.address + ":" + rinfo.port + " " + buffer + "\n");
    handleMessage("#"+channel, ""+buffer);
  });

  udpServers[port].on("listening", function() {
    var address = udpServers[port].address();
    process.stdout.write("[udp] Server listening on " + address.address + ":" + address.port + " for #" + channel + "\n");
  });

  udpServers[port].bind(port, '0.0.0.0');
}

function handleMessage(channel, message) {

  if(action = message.match(/^ACTION (.+)/)) {
    console.log("ACTION "+action[1]);
    bot.action(channel, action[1]);

  } else if(priv = message.match(/^PRIV ([^ ]+) (.+)/)) {
    console.log(message);
    bot.say(priv[1], priv[2]);

  } else if(topic = message.match(/^TOPIC (#[^ ]+) (.+)/)) {
    bot.send("TOPIC", topic[1], topic[2]);

  } else {
    bot.say(channel, message);
  }
}
