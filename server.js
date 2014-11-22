var app = require('http').createServer(handler).listen(process.env.PORT || 80),
    fs = require('fs'),
    io = require('socket.io').listen(app);

console.log("process.env.PORT: " + process.env.PORT)

io.set('log level', 1);
var performerSockets = [];
var motionEvents = [];
var emitRate = 200;
// keep current settings, resend periodically to protect against dropped messages
var synthSettings = {
  keepAlive: {methodName: "keepAlive"},
  connectCounter: {
    methodName: "connectCounter",
    value: 0
  },
  maxEverConnected: {
    methodName: "maxEverConnected",
    value: 0
  }
};
var SETTINGS_FILE_LOC = "persistance/settings.json";

// ==============================
// =       load settings        =
// ==============================

fs.readFile( SETTINGS_FILE_LOC, function (err, data) {
  if (err) {
    throw err; 
  }
  var loadedSettings = JSON.parse(data);
  for(var key in loadedSettings){
    synthSettings[key] = loadedSettings[key];
  }
  synthSettings.connectCounter.value = 0;
});


var writeSynthSettings = function() {
  fs.writeFile(SETTINGS_FILE_LOC, JSON.stringify(synthSettings), function(err) {
      if(err) {
          console.log(err);
      } else {
          console.log("The file was saved!");
      }
  });
}

function handler(req, res) {
  if (req.url === "/") {
    fs.readFile(__dirname + '/performer.html', function(err, data) {
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
  synthSettings.connectCounter.value++;
  if (synthSettings.connectCounter.value > synthSettings.maxEverConnected.value){
    synthSettings.maxEverConnected.value = synthSettings.connectCounter.value;
  }
  writeSynthSettings();
    
  socket.on('disconnect', function() { 
    console.log('disconnected on ' + socket.id);
    if(synthSettings.connectCounter.value > 0){
      synthSettings.connectCounter.value--;
    }
    writeSynthSettings();
  });
  
  // continually broadcase all of the messages that have come in 
  // to make sure all the synths are in the same state
  function repeatBroadcastSettings() {
    
    socket.broadcast.to('performers').emit('control', data);
    for (var key in synthSettings) {
      if (synthSettings.hasOwnProperty(key)) {
        var data = synthSettings[key];
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

  socket.on('ntp', function(data) {
    
    socket.emit('ntp', {
      serverRecievedTime:  new Date().getTime(),
      clientSentTime: data.timeStamp});
    
  })

  socket.on('control', function(data) {
    data.id = socket.id;
    socket.broadcast.to('performers').emit('control', data);
    synthSettings[data.methodName] = data;
    console.log(JSON.stringify(synthSettings));
    writeSynthSettings();
  });

});
