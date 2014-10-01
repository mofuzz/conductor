var AudioController = function(){
  var context;
  var osc;
  var gain;
  var env;
  var scheduleRate = 100; // times per second
  var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
  var bpm = 140;
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

    while(latestScheduledNoteTime < now + scheduleAheadTime){
      var freq = midiToFreq( 40 +  scaleDegree(baseScaleDegree + (noteCount++ % arpeggLen)));
      osc.frequency.setValueAtTime( freq , nextNoteTime);
      env.gain.setValueAtTime(1, nextNoteTime);
      env.gain.linearRampToValueAtTime(mSustain, nextNoteTime + secsPer16th());
      latestScheduledNoteTime = nextNoteTime;
      latestScheduledNoteDuration = secsPer16th();
      nextNoteTime += secsPer16th();
    }
  
    nextTimeoutID = setTimeout(schedule, 1 / scheduleRate);
    
    // kill the sound if keepalive wasn't recieved by the server
    if(Date.now() - lastKeepAlive < 2000){
        if(connectionLost){
          clearMessage();
        }
        connectionLost = false;
    }else if(Date.now() - lastKeepAlive > 10000){
      self.setVolume(0);
      connectionLost = true;
    }
    
    if(connectionLost){
      message("Can't find server. Quiet.");
    }
    
  }
  
  var self = {
    startSound: function () {

      if(!playing){
        
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
    setBPM: function(val) {
      bpm = val;
    },
    // this probably doesn't belong in audiocontroller, but 
    // quick and dirty, it works
    setLock: function(val) {
      mLocked = val;  
      if(mLocked){
        if(!isMessageVisible()){
          message(rand([
            "Listen."
          ]));          
        }
      }else{
        clearMessage();
      }
      if(self.onSetLocked){
        self.onSetLocked();
      }
    },
    isLocked: function() {
      return mLocked;
    },
    setSustain: function(val) {
      mSustain = val;
    },
    offsetBpm: function(val){
      bpmOffset = val;
    }
  };
  return self;
}