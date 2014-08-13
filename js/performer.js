var socket = io.connect('http://'+window.location.hostname);
var $fun;
var touching= false;

$(document).ready(function(){
    
    // containerNode = document.getElementById('canvas');
    // myp5 = new p5(s, containerNode);
    // 
    $fun = $("#fun");
    
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
      audioController.setBaseScaleDegree( 20 * event.gesture.center.pageY / $(this).height() );
      audioController.setArpeggLen(1 +  20 * event.gesture.center.pageX / $(this).width() );
    })
    .on('release', function(event){
      //touchDeactivate();
    });
    
});

var s = function( sketch ) {
  sketch.setup = function() {
    sketch.colorMode("hsb");
    sketch.createCanvas(window.innerWidth, window.innerHeight);
    sketch.background(0,0,1);
  };

  sketch.draw = function() {
    if(touching == 0){
      sketch.background(0,0,0);
    } else {
      sketch.background(1,0,1);
    }
  }
};

socket.on('connect', function(){
  socket.emit('identify', {data:'performer'});
  console.log('connected');
});

socket.on('motion', function(data){
  touching=data.state;
  console.log(data);
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
  
  var midiToFreq = function(midiNote){
    return 440 * Math.pow(2, (midiNote-69)/12);
  }
  
  var scale = [0,3,5,7,10];
  var scaleDegree = function(degree) {
    var octave = Math.floor(degree / scale.length);
    var baseNumber = degree % scale.length;
    return scale[baseNumber] + 12 * octave;    
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
  }
  
  var self = {
    startSound: function () {

      context = new AudioContext();
      latestScheduledNoteTime = context.currentTime;
      
      osc = context.createOscillator();
      osc.type = "square";
      gain = context.createGain();
      gain.gain.value = 0.1;
      osc.start(0);
      osc.connect(gain)
      gain.connect(context.destination);
      
      schedule();
      playing = true;
      
    },
    stopSound: function() {
      gain.gain.value = 0;
      clearTimeout( nextTimeoutID );
      playing = false;
    },
    isPlaying: function() {
      return playing;
    },
    setBaseScaleDegree: function(val){
      baseScaleDegree = Math.floor(val);
    },
    setArpeggLen: function(val) {
      arpeggLen = Math.floor(val);
    }
  };
  return self;
}

var audioController = AudioController();





