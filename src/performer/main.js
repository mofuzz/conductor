$(document).ready(function(){

    var audioController = null;

  // ============================================
  // =            Socket communication          =
  // ============================================

  var socket = io.connect('http://'+window.location.hostname);

  socket.on('connect', function(){
    socket.emit('identify', {data:'performer'});
    console.log('connected');
  });

  socket.on('control', function(data){
    if(data && audioController){
      if(audioController[data.methodName]){
        audioController[data.methodName](data.value);
      }
    }
  });

  // =============================================
  // =                 NTP Syncing               =
  // =============================================

  var ntp = NTPClient(socket);
  ntp.sync();
  
  // ================================
  // =          draw GUI             =
  // ================================

  var popupMessage = PopupMessage();

  var gui = GridGUI();
  gui.addTouchResponder(function(x,y) {
    if(!audioController){
      audioController = AudioController(popupMessage.message);
      audioController.startSound();
    }
    audioController.setBaseScaleDegree(y);
    audioController.setArpeggLen(x + 1);
    ntp.getCurrentServerTime();
  });


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

