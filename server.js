var app = require('http').createServer(handler).listen(80),
    fs = require('fs'),
    io = require('socket.io').listen(app);

io.set('log level', 1);
var performerSockets = [];
var motionEvents = [];
var emitRate = 200;
// keep current settings, resend periodically to protect against dropped messages
var synthSettings = [{methodName: "keepAlive"}];

function handler(req, res) {
  if (req.url === "/") {
    fs.readFile(__dirname + '/index.html', function(err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200)
      res.end(data);
    });
  } else {
    fs.readFile(__dirname + req.url, function(err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + req.url);
      }
      res.writeHead(200);
      res.end(data);
    });
  }
}



io.sockets.on('connection', function(socket) {
  console.log('connected on ' + socket.id);

  // continually broadcase all of the messages that have come in 
  // to make sure all the synths are in the same state

  function repeatBroadcastSettings() {
    console.log("repeat broadcast called");
    for (var key in synthSettings) {
      if (synthSettings.hasOwnProperty(key)) {
        var data = synthSettings[key];
        console.log("repeat broadcast: " + data.methodName);
        socket.broadcast.to('performers').emit('control', data);
      }
    }
    setTimeout(repeatBroadcastSettings, 1000);
  }

  repeatBroadcastSettings();

  socket.on('identify', function(data) {
    performerSockets.push(socket.id);
    socket.join('performers');
    console.log("performer connected on " + socket.id);
  });

  socket.on('motion', function(data) {
    data.id = socket.id;
    socket.broadcast.to('performers').emit('motion', data);
  });

  socket.on('control', function(data) {
    data.id = socket.id;
    socket.broadcast.to('performers').emit('control', data);
    synthSettings[data.methodName] = data;
  });

});
