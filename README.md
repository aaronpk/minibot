# Minibot

A minimal IRC bot used to send messages into an IRC channel via HTTP, UDP and SMTP APIs.

![minibot](minibot-logo-128.png)

## IRC Service

The IRC bot is configured by creating a config.json file and setting the appropriate config variables.

When the service starts, it will connect and join the specified channels. 


## HTTP API

#### `POST /channel/{channel}`

Sends a message to the specified channel. The channel should be specified including the "#" URL-encoded to "%23".

* `access_token` - The auth token specified in the config file
* `content` - The text to send to the channel 


#### `POST /raw`

Sends a raw IRC command to the server. This can be used to send JOIN and PART messages, as well as PRIV messages to users or other channels.

* `access_token` - The auth token specified in the config file
* `command` - The raw IRC command to send

#### `GET /channel/{channel}/nicks`

Request a list of nicks in the specified channel.

* `access_token` - The auth token specified in the config file

```
{
  "nicks": {
    "Minibot": "",
    "aaronpk": "",
    "Loqi": "@"
  }
}
```

#### `POST /channel/{channel}/errbit`

Set this URL as a notification service in Errbit to have the bot output nicely-formatted messages to an IRC channel from Errbit.


## UDP API

The UDP API mirrors the [MediaWiki RecentChanges IRC Bot](http://www.mediawiki.org/wiki/Manual:MediaWiki-Recent_Changes-IRCBot) protocol.

Basically you just send UDP data to the port it's listening on, and it will send that to the channel. Port-to-channel mappings are defined in the config file as such:

```
  "udp": {
    "40001": "channel1",
    "40002": "channel2"
  }
```

To send UDP data, do something like this:

#### PHP

```php
$host = 'minibot.example.com';
$port = 40001;
$text = 'Hello from UDP';

$sock = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
socket_sendto($sock, $text, strlen($text), 0, $host, $port);
```

#### Ruby

```ruby
require 'socket'

host = 'minibot.example.com'
port = 40001
text = 'Hello from UDP'

@sock = UDPSocket.open
@sock.send text, 0, host, port
```


## SMTP Server

Minibot can run an SMTP server to forward the subject line of incoming emails to IRC channels.

To use this, you would most likely set up an external mail server like Postfix to forward specific email addresses or domains to this service via an alias. 

#### Configuration

Include an "smtp" object in the config file specifying the port you want the SMTP server to listen on:

```
  "smtp": {
    "port": 2500
  }
```

Then, set up your mail server to forward mail to this service.

Set up an alias passing emails from a domain like @irc.example.com, and this service 
will send a message into the specified channel based on the "to" address.

This may look something like the following rules in Postfix:

Create an alias mapping your desired external-facing email addresses to the transport:

    @irc.example.com -> @irc-gateway.example.com

Set up a transport routing anything at the gateway address to the minibot service:

    irc-gateway.example.com -> smtp:minibot.example.com:2500

You'll also need to add `irc.example.com` to the "domains" list in Postfix.

You will need to make an MX record for your subdomain as well, for example:
  
    irc.example.com. 3600 IN MX 0 mail.example.com.

These are just examples, hopefully there's enough there to get you started. You will probably want to already be familiar with configuring Postfix transports, or at least be able to find other tutorials online.

#### Usage

To send "Hello world" to the channel "#team", you would send an email like this:

    From: aaron@parecki.com
    To: team@irc.example.com
    Subject: Hello world

    This text is ignored.

The bot will output the following into the IRC channel #team:

    [aaron@parecki.com] Hello World



## Apache License

Copyright (c) 2013 Esri, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

