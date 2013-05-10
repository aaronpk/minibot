# Minibot

A minimal IRC bot used to spew messages into an IRC channel via an HTTP API.

## IRC Service

The IRC bot is configured by creating a config.json file and setting the appropriate config variables.

When the service starts, it will connect and join the specified channels. 


## API

### POST /channel/{channel}

Params

* `token` - The auth token specified in the config file
* `message` - The text to send to the channel 

Sends a message to the specified channel. The channel should be specified without the "#"

### POST /raw

Params

* `token` - The auth token specified in the config file
* `command` - The raw IRC command to send

### GET /channel/{channel}/nicks

Query Params

* `token` - The auth token specified in the config file

Request a list of nicks in the specified channel.

```
{
  "nicks": {
    "Munin": "",
    "aaronpk": "",
    "Loqi": "@"
  }
}
```

## Apache License

Copyright (c) 2013 Esri, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

