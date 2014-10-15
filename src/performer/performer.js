/*
TODO: 
- start sound on reconnect / don't require reload after server loss
- allow conductor to mute a percentage of phones
- one note feature (just plays the highest note)
- create alternate URLs
- create morganpackard.com/choir
- add "locked indicator"


- bass mode
- 

*/


var touching= false;
var currPos = [0,0];
var currPosNormalized = [0,0];
var xMin = 0;
var xMax = 1;
var yMin = 0;
var yMax = 0;

// ===============================
// =          Messaging          =
// ===============================

var message = function(text) {
  var BORDER = 20;
  $message = $("#message");
  $win = $(window);
  $message.show();
  $message.css({
    top: BORDER, 
    left:BORDER, 
    width: $win.width() - 2 * BORDER, 
    height: $win.height() - 2 * BORDER
  })
  
  $txt = $message.find(".text")
  
  $txt
    .text(text)
    .css({
    left: ($win.width() - $txt.width())/2,
    top: ($win.height() - $txt.height())/2
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

$(document).ready(function(){
  
  // ================================
  // =          draw GUI             =
  // ================================
  

  // ========================================================
  // =             Physical Event Handlers                  =
  // ========================================================
  
  document.addEventListener('pagehide',function(){
    alert("background");
    audioController.stopSound();
  }, false);
    
  
  var tilt = function(theTilt) {
      var THRESHOLD = 10;
      var dir = theTilt[1] > 0 ? 1 : -1;
      var adjustedTilt = Math.max(0, Math.abs(theTilt[1]) - THRESHOLD) * dir;
      audioController.offsetBpm(adjustedTilt / 15)
  };

  if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", function () {
          tilt([event.beta, event.gamma]);
      }, true);
  } else if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', function () {
          tilt([event.acceleration.x * 2, event.acceleration.y * 2]);
      }, true);
  } else {
      window.addEventListener("MozOrientation", function () {
          tilt([orientation.x * 50, orientation.y * 50]);
      }, true);
  }
    
  Hammer(document.body, {
      prevent_default: true,
      no_mouseevents: true
    })
    .on('touch', function(event) {
      if(audioController.isPlaying()){
        //audioController.stopSound();
        clearMessage();
      }else{
        audioController.startSound();
      }
      if(!audioController.isLocked()){
        currPos = [event.gesture.center.pageX, event.gesture.center.pageY];
        currPosNormalized[0] = event.gesture.center.pageX / $(this).width();
        eventResponses.clampPosition();
        eventResponses.positionJoystick();
        eventResponses.currPosChanged();
      }
    })
    .on('drag', function(event){
      if(!audioController.isLocked()){
        currPos = [event.gesture.center.pageX, event.gesture.center.pageY];
        currPosNormalized[0] = event.gesture.center.pageX / $(this).width();
        eventResponses.clampPosition();
        eventResponses.positionJoystick();
        eventResponses.currPosChanged();
      }
    })
    .on('release', function(event){
      $("#message").hide();
    });
    
    if(audioController){
        var origColor = $("body").css("background-color")
        audioController.onSetLocked = function() {
            $("body").css({"background-color": audioController.isLocked() ? "#000000" : origColor})
        }
      
      
        // audioController.setXMin = function(val) {
        //     xMin = val;
        //     xMax = Math.max(xMin, xMax);
        //     eventResponses.boundsChanged();
        // }
        // 
        // audioController.setXMax = function(val) {
        //     xMax = val;
        //     xMin = Math.min(xMin, xMax);
        //     eventResponses.boundsChanged();
        // }
        // 
        // audioController.setYMin = function(val) {
        //     yMin = val;
        //     yMax = Math.max(yMin, yMax);
        //     eventResponses.boundsChanged();
        // }
        // 
        // audioController.setYMax = function(val) {
        //     yMax = val;
        //     yMin = Math.min(yMin, yMax);
        //     eventResponses.boundsChanged();
        // }

      
    }
    
});


// ============================================
// =            Socket communication          =
// ============================================

var socket = io.connect('http://'+window.location.hostname);

socket.on('connect', function(){
  socket.emit('identify', {data:'performer'});
  console.log('connected');
});

socket.on('motion', function(data){
  touching=data.state;
  // console.log(data);
});

socket.on('control', function(data){
  if(data){
    if(!audioController[data.methodName]){
      //alert("method not found: " + data.methodName)
    }
    audioController[data.methodName](data.value);
  }
});

var audioController = AudioController();

var eventResponses = {
    clampPosition: function() {
        
        var docWidth = $(window).width();
        var docHeight = $(window).height();
        currPos[0] = Math.min(docWidth * xMax, Math.max(docWidth * xMin, currPos[0]) );
        currPos[1] = Math.min(docHeight * yMax, Math.max(docHeight * yMin, currPos[1]) );
    },
    boundsChanged: function(){
        var docWidth = $(window).width();
        var docHeight = $(window).height();
        var left = docWidth * xMin;
        var right = docWidth * xMax;
        var width = Math.max(0, right - left) + INDICATOR_SQUARE_SIZE;
        
        var top = docHeight * yMin;
        var bottom = docHeight * yMax;
        var height = Math.max(0, bottom - top) + INDICATOR_SQUARE_SIZE;
        
        $("#bounds").css({left: left, width: width, top: top, height: height});
        eventResponses.clampPosition();
        eventResponses.currPosChanged();
        eventResponses.positionJoystick();
    },
    positionJoystick: function(){
       //TODO -- remove
    },
    currPosChanged: function() {
        audioController.setBaseScaleDegree( GRID_DIMENSIONS.x * currPos[1] / $(window).height() );
        var maxArpeggLen = GRID_DIMENSIONS.y;
        audioController.setArpeggLen(1 + Math.min(maxArpeggLen * xMax,  Math.max(maxArpeggLen * xMin, maxArpeggLen * currPosNormalized[0]) )  );
    }
}








