;(function( window){ 
 'use strict';
var AboutScreen = function() {
  
  $(document).ready(function(){
    var windowJQ = $(window);
    var about = $("#about");
    var margin = 100;
    var isDisplayed = false;
    var toggleBtn = about.find(".toggleBtn");
    var getRightShiftForHide = function() {
      return $(window).width() - toggleBtn.outerWidth();
    }
    about.find(".toggleBtn").click(function() {
      var left = isDisplayed? getRightShiftForHide(): margin;
      about.animate({
        left: left + "px"
      }, 100);
      about.find(".toggleBtn .widthHolder").html(isDisplayed ? "?" : "x");
      isDisplayed = !isDisplayed;
    })

    about.css({
      left: getRightShiftForHide() + "px",
      width: ($(window).width() - (margin * 2)) + "px",
    });

    about.find(".content").css({
      height: ($(window).innerHeight() - (margin * 2)) + "px",
      width: (about.width() - about.find(".toggleBtn").outerWidth() - 5) + "px"
    });

  });
  
  return {
    connectCounter: function(value) {
      $("#currentChoirCount").html(value);
    },
    maxEverConnected: function(value) {
      $("#maxChoirCount").html(value);
    }
    

  }  
  
}

;var AudioController = function(popupMessage, ntpClient){
  var localRandSeed = Math.random();
  var context;
  var osc;
  var gain;
  var env;
  var scheduleRate = 100; // times per second
  var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
  var bpm = 130;
  var bpmOffset = 0;
  var nextTimeoutID;
  var latestScheduledNoteTime;
  var latestScheduledNoteDuration;
  var secsPer16th = function() { var SECS_PER_MINUTE = 60; var MINUTES_PER_BEAT = 1 / (bpm + bpmOffset); return MINUTES_PER_BEAT * SECS_PER_MINUTE / 4;}
  var noteCount = 0;
  var playing = false;
  var baseScaleDegree = 0;
  var arpeggLen = 4;
  var currentScale = 0;
  var scales = [[0,3,5,7,10], [0,4,7,9, 11]];
  var lastKeepAlive = Date.now();
  var connectionLost = false;
  var mLocked = false;
  var mSustain = 1;
  var steps = [];
  var minSeqLen = 1;
  var MILLIS_PER_SEC = 1000;

  var Step = function(scaleDegree) {
    var self = {};
    self.scaleDegree = scaleDegree;
    self.duration = Math.random();
    self.detune = 0.99 + Math.random() * 0.02;
    return self;
  };

  var initSteps = function() {
    steps = [];
    for (var i=0; i < Math.max(minSeqLen, arpeggLen); i++) {
      //steps should be the same each time given same params
      var seed = String(i + arpeggLen + baseScaleDegree + currentScale + mSustain + localRandSeed);
      Math.seedrandom( seed );
      steps.push(Step( scaleDegree( baseScaleDegree + ( i % arpeggLen)  )));
    };
  };
  
  // initialization;
  context = new AudioContext();
  latestScheduledNoteTime = context.currentTime;
  latestScheduledNoteDuration = secsPer16th();
  
  
  var midiToFreq = function(midiNote){
    return 440 * Math.pow(2, (midiNote-69)/12);
  }
  
  var scaleDegree = function(degree) {
    var octave = Math.floor(degree / scales[currentScale].length);
    var baseNumber = degree % scales[currentScale].length;
    return scales[currentScale][baseNumber] + 12 * octave;    
  }
  
  var schedule = function() {
    

    var now = context.currentTime;
    var nextNoteTime =  latestScheduledNoteTime + latestScheduledNoteDuration;
    var howLongTillNextNote = nextNoteTime- now;
    var currentServerTime = ntpClient.getCurrentServerTime();
    var diffBetweenNowAndServerInMillis =  now * MILLIS_PER_SEC - currentServerTime;
    var nextNoteTimeInServerTime =   nextNoteTime * MILLIS_PER_SEC - diffBetweenNowAndServerInMillis;
    var millisPer16th = secsPer16th() * MILLIS_PER_SEC;
    // do a simple round, for now, expecting that 16ths started at time = 0 (1970)
    var roundedNextNoteTimeInServerTime = Math.round(nextNoteTimeInServerTime / millisPer16th) * millisPer16th;
    nextNoteTime = (roundedNextNoteTimeInServerTime + diffBetweenNowAndServerInMillis) / MILLIS_PER_SEC;

    while(latestScheduledNoteTime < now + scheduleAheadTime){
      var nextStep = steps.shift();
      steps.push(nextStep);
      var freq = midiToFreq( 40 +  nextStep.scaleDegree) * nextStep.detune;
      osc.frequency.setValueAtTime( freq , nextNoteTime);
      env.gain.setValueAtTime(1, nextNoteTime);
      env.gain.linearRampToValueAtTime(mSustain, nextNoteTime + secsPer16th() * nextStep.duration);
      latestScheduledNoteTime = nextNoteTime;
      latestScheduledNoteDuration = secsPer16th();
      nextNoteTime += secsPer16th();
    }
  
    nextTimeoutID = setTimeout(schedule, 1 / scheduleRate);
    
    // kill the sound if keepalive wasn't recieved by the server
    if(Date.now() - lastKeepAlive < 2000){
        if(connectionLost){
          popupMessage.clearMessage();
        }
        connectionLost = false;
    }else if(Date.now() - lastKeepAlive > 10000){
      self.setVolume(0);
      connectionLost = true;
    }
    
    if(connectionLost){
      popupMessage.message("Can't find server. Quiet.");
    }
    
  }
  
  var self = {
    startSound: function () {

      if(!playing){
        initSteps();
        console.log("startSound")
        osc = context.createOscillator();
        osc.type = "square";
        gain = context.createGain();
        gain.gain.value = 0;
        env = context.createGain();
        env.gain.value = 1;
        osc.start(0);
        osc.connect(env)
        env.connect(gain)
        
        gain.connect(context.destination);
        
        schedule();
        gain.gain.linearRampToValueAtTime(1, context.currentTime + 1 );
        
        playing = true;
      }
      
      
    },
    stopSound: function() {
      gain.gain.linearRampToValueAtTime(0, context.currentTime + 1 );
      clearTimeout( nextTimeoutID );
      playing = false;
    },
    setVolume: function(vol) {
        if(gain && gain.gain){
          gain.gain.linearRampToValueAtTime(vol, context.currentTime + 1 ); 
        }
    },
    isPlaying: function() {
      return playing;
    },
    setBaseScaleDegree: function(val){
      var newVal = Math.floor(val);
      var changed = newVal != baseScaleDegree;
      baseScaleDegree = newVal;
      if(changed){
        initSteps();
      }
    },
    setArpeggLen: function(val) {
      var newLen = Math.floor(val);
      var changed = newLen != arpeggLen;
      arpeggLen = newLen;
      if(changed){
        initSteps();
      }
    },
    setScale: function(index) {
      var newScale = index % scales.length
      var changed = currentScale != newScale;
      currentScale = newScale;
      if(changed){
        initSteps();
      }
    },
    keepAlive: function(index){
      lastKeepAlive = Date.now();
    },
    setBPM: function(val) {
      bpm = val;
    },
    setSustain: function(val) {
      mSustain = val;
    },
    offsetBpm: function(val){
      bpmOffset = val;
    },
    setMinSeqLen: function(val) {
      var changed = val != minSeqLen;
      minSeqLen = val;
      if(changed){
        initSteps();
      }
    }
  };
  return self;
};var GridGUI = function() {
  var GRID_DIMENSIONS = {x: 10, y:10}
  var touchResponders = [];
  var divs = [];

  function HSVtoRGB(h, s, v) {
      var r, g, b, i, f, p, q, t;
      if (h && s === undefined && v === undefined) {
          s = h.s, v = h.v, h = h.h;
      }
      i = Math.floor(h * 6);
      f = h * 6 - i;
      p = v * (1 - s);
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (i % 6) {
          case 0: r = v, g = t, b = p; break;
          case 1: r = q, g = v, b = p; break;
          case 2: r = p, g = v, b = t; break;
          case 3: r = p, g = q, b = v; break;
          case 4: r = t, g = p, b = v; break;
          case 5: r = v, g = p, b = q; break;
      }
      
      function componentToHex(c) {
          var hex = c.toString(16);
          return hex.length == 1 ? "0" + hex : hex;
      }

      function rgbToHex(r, g, b) {
          return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
      }
      
      return rgbToHex(Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255))
      
  }
  
  var squareWidth = $(window).width() / GRID_DIMENSIONS.x;
  var squareHeight = $(window).height() / GRID_DIMENSIONS.y;
  
 
  for (var x=0; x < GRID_DIMENSIONS.x; x++) {
    var column = [];
    divs.push(column);
    for (var y=0; y < GRID_DIMENSIONS.y; y++) {
      (function() {
        var localX = x, localY = y;
        var color = HSVtoRGB( (y + x ) / GRID_DIMENSIONS.y, 1 - x * 0.5 / GRID_DIMENSIONS.x, 1 - x * 0.5 / GRID_DIMENSIONS.x);
        var div = $('<div/>', {
            css: {
                "background-color": color,
                "width": squareWidth + 1,
                "height": squareHeight + 1,
                "position": "absolute",
                "left": x * squareWidth,
                "top": y * squareHeight,

              }
        })
        .data({
          origColor: color,
          pos: {x:x, y:y}
        })
        .addClass("gridButton")
        .bind("mousedown touchstart touchmove", function() {
          $(touchResponders).each(function(i, responder) {
            responder(localX,localY);
          });
          $(".gridButton").each(function(i, btn) {
            $(btn).css({
                "background-color": $(btn).data()["origColor"]
            });
          });
          $(this).css({
            "background-color": "#ffffff"
          })
        });
        $("body").append(div);
        column.push(div);
      })()
    };
  };
  
  var self = {
    GRID_DIMENSIONS: GRID_DIMENSIONS,
    addTouchResponder: function(responder) {  touchResponders.push(responder) }
  }
  
  return self;
  
};var NTPClient = function(socket) {
  
  var RoundTrip = function(serverResponse) {
    
    var clientSentTime = serverResponse.clientSentTime;
    var serverRecievedTime = serverResponse.serverRecievedTime;
    var clientReceivedTime = new Date().getTime();
    
    
    var self = {
      // how far ahead is the server of the client
      getTimeOffset: function(){
        return serverRecievedTime - (clientSentTime + self.getCommunicationLatency())
      },
      // how long did it take for a message to get from client to server
      getCommunicationLatency: function() {
        return (clientReceivedTime - clientSentTime) / 2;
      }
    };
    
    // console.log("new RoundTrip. latency is: " + self.getCommunicationLatency() + "offset is: " + self.getTimeOffset());
    
    return self;
  }
  
  var roundtrips = [], MAX_TRIPS = 1000, currentServerTime = 0, fastestRoundTrip;
  
  var initiateRoundTrip = function() {
     socket.emit('ntp', {timeStamp: new Date().getTime() });
  }
  
  var analyzeRoundTrips = function(){
    if(!fastestRoundTrip && roundtrips.length){
      fastestRoundTrip = roundtrips[0];
    }
    $.each(roundtrips, function(i, trip) {
      if(trip.getCommunicationLatency() < fastestRoundTrip.getCommunicationLatency()){
        fastestRoundTrip = trip;
      }
    })
  }
  
  socket.on('ntp', function(data){
    roundtrips.push(RoundTrip(data));
    if(roundtrips.length < MAX_TRIPS){
      setTimeout(function() {
        initiateRoundTrip();
      }, 500);
    }
    analyzeRoundTrips();
  });
  
  var self = {
    sync: function() {
     initiateRoundTrip();
    },
    getCurrentServerTime: function(){
      var timeOffset = fastestRoundTrip?  fastestRoundTrip.getTimeOffset() : 0;
      return new Date().getTime() + fastestRoundTrip.getTimeOffset();
    },
    getBestRoundtripLatency: function() {
      return fastestRoundTrip?  fastestRoundTrip.getCommunicationLatency() : -1;
    }
  };
  
  return self;
};;// ===============================
// =          Messaging          =
// ===============================

var PopupMessage = function() {
  
  var message = function(text) {
    var BORDER = 20, 
      messageDiv = $("#message"),
      win = $(window);
    messageDiv.show();
    messageDiv.css({
      top: BORDER, 
      left:BORDER, 
      width: win.width() - 2 * BORDER, 
      height: win.height() - 2 * BORDER
    })

    var txt = messageDiv.find(".text")

    txt
      .text(text)
      .css({
      left: (win.width() - txt.width())/2,
      top: (win.height() - txt.height())/2
    });
    $("#bounds").hide();
  }

  var clearMessage = function() {
    $("#message").hide();
    $("#bounds").show();
  }

  var isMessageVisible = function() {
    return $("#message").is(":visible");
  }

  return {
    message: message,
    clearMessage: clearMessage,
    isMessageVisible: isMessageVisible
  }
  
}
;$(document).ready(function(){

  var audioController = null;
  var socketMessageHandlers = [];  

  // ============================================
  // =            Socket communication          =
  // ============================================

  var socket = io.connect('http://'+window.location.hostname);

  socket.on('connect', function(){
    socket.emit('identify', {data:'performer'});
    console.log('connected');
  });

  socket.on('control', function(data){
    if(data && typeof data != undefined){
      for(var i = 0; i < socketMessageHandlers.length; i++){
        var handler = socketMessageHandlers[i];
        if(handler[data.methodName]){
          handler[data.methodName](data.value);
        };
      }      
    }

    // if(data && audioController && audioController[data.methodName]){
    //   audioController[data.methodName](data.value);
    // }else if(data && data.methodName === "connectCounter"){
    //   $("#currentChoirCount").html(data.value)
    // }else if(data && data.methodName === "maxEverConnected"){
    //     $("#maxChoirCount").html(data.value)
    // }
  });
  
  // ================================
  // =          draw GUI             =
  // ================================

  var popupMessage = PopupMessage();

  var gui = GridGUI();
  gui.addTouchResponder(function(x,y) {
    if(!audioController){
      audioController = AudioController(popupMessage, ntp);
      audioController.startSound();
    }
    audioController.setBaseScaleDegree(y);
    audioController.setArpeggLen(x + 1);
    socketMessageHandlers.push(audioController);
  });
  
  socketMessageHandlers.push(AboutScreen());
  
  // =============================================
  // =                 NTP Syncing               =
  // =============================================

  var ntp = NTPClient(socket);
  ntp.sync();
  
  var displayLatency = function() {
    var LATENCY_MAX = 50;
    var bestLatency = ntp.getBestRoundtripLatency();
    if(bestLatency > LATENCY_MAX){
      popupMessage.message("Waiting for a good network situation ("+LATENCY_MAX+" ms or less latency). Best yet: " + ntp.getBestRoundtripLatency());
    }else{
      popupMessage.clearMessage();
    }
    setTimeout(function() {
      displayLatency();
    }, 1000);
  }
  displayLatency();

  // ========================================================
  // =             Physical Event Handlers                  =
  // ========================================================


  // var tilt = function(theTilt) {
  //     var THRESHOLD = 10;
  //     var dir = theTilt[1] > 0 ? 1 : -1;
  //     var adjustedTilt = Math.max(0, Math.abs(theTilt[1]) - THRESHOLD) * dir;
  //     audioController.offsetBpm(adjustedTilt / 15)
  // };
  // 
  // if (window.DeviceOrientationEvent) {
  //     window.addEventListener("deviceorientation", function () {
  //         tilt([event.beta, event.gamma]);
  //     }, true);
  // } else if (window.DeviceMotionEvent) {
  //     window.addEventListener('devicemotion', function () {
  //         tilt([event.acceleration.x * 2, event.acceleration.y * 2]);
  //     }, true);
  // } else {
  //     window.addEventListener("MozOrientation", function () {
  //         tilt([orientation.x * 50, orientation.y * 50]);
  //     }, true);
  // }

});

}( window ));