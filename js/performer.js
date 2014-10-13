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


var socket = io.connect('http://'+window.location.hostname);
var $fun;
var touching= false;
var currPos = [0,0];
var currPosNormalized = [0,0];
var xMin = 0;
var xMax = 1;
var yMin = 0;
var yMax = 0;
var INDICATOR_SQUARE_SIZE = 20;
var GRID_DIMENSIONS = {x: 10, y:10}

rand = function(arr) {
  return arr[ Math.floor( Math.random() * arr.length )];
}

var message = function(text) {
  $message = $("#message");
  $win = $(window);
  $message.show();
  $message.css({
    top: INDICATOR_SQUARE_SIZE, 
    left:INDICATOR_SQUARE_SIZE, 
    width: $win.width() - 2 * INDICATOR_SQUARE_SIZE, 
    height: $win.height() - 2 * INDICATOR_SQUARE_SIZE
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

    /* accepts parameters
     * h  Object = {h:x, s:y, v:z}
     * OR 
     * h, s, v
    */
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
  
  // ================================
  // =          draw UI             =
  // ================================
  
  var squareWidth = $(document).width() / GRID_DIMENSIONS.x;
  var squareHeight = $(document).height() / GRID_DIMENSIONS.y;
  
  var colors = [ "#cccccc", "#dddddd"];
  
  
  
  
  for (var x=0; x < GRID_DIMENSIONS.x; x++) {
    for (var y=0; y < GRID_DIMENSIONS.y; y++) {
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
    };
  };
  
  
  document.addEventListener('pagehide',function(){
    alert("background");
    audioController.stopSound();
  }, false);
    
  $fun = $("#fun");
  
  $indicator = $("#indicator");
    
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
      
      
        audioController.setXMin = function(val) {
            xMin = val;
            xMax = Math.max(xMin, xMax);
            eventResponses.boundsChanged();
        }

        audioController.setXMax = function(val) {
            xMax = val;
            xMin = Math.min(xMin, xMax);
            eventResponses.boundsChanged();
        }

        audioController.setYMin = function(val) {
            yMin = val;
            yMax = Math.max(yMin, yMax);
            eventResponses.boundsChanged();
        }

        audioController.setYMax = function(val) {
            yMax = val;
            yMin = Math.min(yMin, yMax);
            eventResponses.boundsChanged();
        }

      
    }
    
});

socket.on('connect', function(){
  socket.emit('identify', {data:'performer'});
  console.log('connected');
});

socket.on('motion', function(data){
  touching=data.state;
  // console.log(data);
});

// ============================================
// =            Control Events                =
// ============================================

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
        $indicator.css({top: currPos[1], left: currPos[0]});
    },
    currPosChanged: function() {
        audioController.setBaseScaleDegree( GRID_DIMENSIONS.x * currPos[1] / $(window).height() );
        var maxArpeggLen = GRID_DIMENSIONS.y;
        audioController.setArpeggLen(1 + Math.min(maxArpeggLen * xMax,  Math.max(maxArpeggLen * xMin, maxArpeggLen * currPosNormalized[0]) )  );
    }
}








