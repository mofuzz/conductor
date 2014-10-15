$(function() {
  $(document).ready(function(){

    // ================================
    // =          draw GUI             =
    // ================================
    var gui = GUI();



    // ========================================================
    // =             Physical Event Handlers                  =
    // ========================================================


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

 
  });
})