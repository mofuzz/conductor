/*
TODO: 
-freeze control

*/


var socket = io.connect('http://'+window.location.hostname);
var $fun;
var touching= false;
var currPos = [0,0]

$(document).ready(function(){
  
  document.addEventListener('pagehide',function(){
    alert("background");
    audioController.stopSound();
  }, false);
    
  $fun = $("#fun");
  
  $indicator = $("#indicator");
    
  Hammer($fun[0], {
      prevent_default: true,
      no_mouseevents: true
    })
    .on('touch', function(event) {
      if(audioController.isPlaying()){
        //audioController.stopSound();
      }else{
        audioController.startSound();
      }
    })
    .on('drag', function(event){
      currPos = [event.gesture.center.pageX, event.gesture.center.pageY];
      $indicator.css({top: currPos[1], left: currPos[0]})
      audioController.setBaseScaleDegree( 20 * event.gesture.center.pageY / $(this).height() );
      audioController.setArpeggLen(1 +  20 * event.gesture.center.pageX / $(this).width() );
    })
    .on('release', function(event){
      //touchDeactivate();
    });
    
});

// Not sure p5 is the way to go. Might be overkill
// var s = function( sketch ) {
//   sketch.setup = function() {
//     sketch.colorMode("hsb");
//     sketch.createCanvas(window.innerWidth, window.innerHeight);
//     sketch.background(0,0,1);
//   };
// 
//   sketch.draw = function() {
//     if(touching == 0){
//       sketch.background(0,0,0);
//     } else {
//       sketch.background(1,0,1);
//     }
//     sketch.color(255, 255, 255);
//     sketch.rect(currPos[0], currPos[1], 55, 55);
//   }
// };

// containerNode = document.getElementById('canvas');
// myp5 = new p5(s, containerNode);


socket.on('connect', function(){
  socket.emit('identify', {data:'performer'});
  console.log('connected');
});

socket.on('motion', function(data){
  touching=data.state;
  console.log(data);
});

// ============================================
// =            Control Events                =
// ============================================

socket.on('control', function(data){
  if(data){
    if(!audioController[data.methodName]){
      alert(data.methodName)
    }
    audioController[data.methodName](data.value);
    console.log(data);
  }
});





var AudioController = function(){
  var context;
  var osc;
  var gain;
  var scheduleRate = 100; // times per second
  var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
  var BPM = 140;
  var nextTimeoutID;
  var latestScheduledNoteTime;
  var SECS_PER_16TH = (function() { var SECS_PER_MINUTE = 60; var MINUTES_PER_BEAT = 1 / BPM; return MINUTES_PER_BEAT * SECS_PER_MINUTE / 4;})();
  var noteCount = 0;
  var playing = false;
  var baseScaleDegree = 0;
  var arpeggLen = 4;
  var currentScale = 0;
  var scales = [[0,3,5,7,10], [0,4,7,9, 11]];
  var lastKeepAlive = Date.now();
  var connectionLost = false;
  
  // initialization;
  context = new AudioContext();
  latestScheduledNoteTime = context.currentTime;
  
  
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
    var nextNoteTime =  latestScheduledNoteTime + SECS_PER_16TH;

    while(latestScheduledNoteTime < now + scheduleAheadTime){
      var freq = midiToFreq( 40 +  scaleDegree(baseScaleDegree + (noteCount++ % arpeggLen)));
      osc.frequency.setValueAtTime( freq , nextNoteTime);
      latestScheduledNoteTime = nextNoteTime;
      nextNoteTime += SECS_PER_16TH;
    }
  
    nextTimeoutID = setTimeout(schedule, 1 / scheduleRate);
    
    // kill the sound if keepalive wasn't recieved by the server
    if(!connectionLost && Date.now() - lastKeepAlive > 2000){
      self.setVolume(0);
      alert("ERROR -- connection to server lost");
      connectionLost = true;
    }
    
  }
  
  var self = {
    startSound: function () {

      if(!playing){
        
        osc = context.createOscillator();
        osc.type = "square";
        gain = context.createGain();
        gain.gain.value = 0;
        osc.start(0);
        osc.connect(gain)
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
        gain.gain.linearRampToValueAtTime(vol, context.currentTime + 1 );
    },
    isPlaying: function() {
      return playing;
    },
    setBaseScaleDegree: function(val){
      baseScaleDegree = Math.floor(val);
    },
    setArpeggLen: function(val) {
      arpeggLen = Math.floor(val);
    },
    setScale: function(index) {
      currentScale = index % scales.length;
    },
    keepAlive: function(index){
      lastKeepAlive = Date.now();
    },
    // this probably doesn't belong in audiocontroller, but 
    // quick and dirty, it works
    setLock: function(val) {
      
    }
  };
  return self;
}

var audioController = AudioController();





