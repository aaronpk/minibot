# Minibot

A minimal IRC bot used to spew messages into an IRC channel via an HTTP API.

## IRC Service

The IRC bot is configured by creating a config.json file and setting the appropriate config variables.

When the service starts, it will connect and join the specified channels. 


## HTTP API

#### `POST /channel/{channel}`

Sends a message to the specified channel. The channel should be specified without the "#"

* `token` - The auth token specified in the config file
* `message` - The text to send to the channel 


#### `POST /raw`

Sends a raw IRC command to the server. This can be used to send JOIN and PART messages, as well as PRIV messages to users or other channels.

* `token` - The auth token specified in the config file
* `command` - The raw IRC command to send

#### `GET /channel/{channel}/nicks`

Request a list of nicks in the specified channel.

* `token` - The auth token specified in the config file

```
{
  "nicks": {
    "Minibot": "",
    "aaronpk": "",
    "Loqi": "@"
  }
}
```

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



## Apache License

Copyright (c) 2013 Esri, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

