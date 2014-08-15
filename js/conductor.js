var socket = io.connect('http://'+window.location.hostname);

var $fun;
var touching= false;
var hammertime;
var emitter;

window.onload = function(){
  containerNode = document.getElementById('canvas');
 // myp5 = new p5(s, containerNode);
}

var setup = function(){
  $fun = $("#fun");
  hammertime = Hammer($fun[0], {
    prevent_default: true,
    no_mouseevents: true
  })
  .on('touch', function(event){
    touchActivate(event);
  })
  .on('drag', function(event){
    touchActivate(event);
  })
  .on('release', function(event){
    touchDeactivate();
  });
  
  var scale = 0;
  var gain = 1;

  Hammer(document.getElementById("nextScale"))
  .on('release', function(event){
    socket.emit('control', {methodName: "setScale", value: scale++ });
  })
  
  Hammer(document.getElementById("stop"))
  .on('release', function(event){
    socket.emit('control', {methodName: "setVolume", value: 0 });
  })
  
  Hammer(document.getElementById("start"))
  .on('release', function(event){
    socket.emit('control', {methodName: "setVolume", value: 1 * gain });
  })
  
  Hammer(document.getElementById("lock"))
  .on('release', function(event){
    var lockValue, label;
    if($("#lock").text() == "lock"){
      lockValue = 1;
      label = "unlock";
    }else{
      lockValue = 0;
      label = "lock";
    }
    $("#lock").text(label);
    socket.emit('control', {methodName: "setLock", value: lockValue });
  })
  
 $("#volume").change(function() {
   gain = $(this).val() / $(this).attr("max");
  socket.emit('control', {methodName: "setVolume", value: gain });
 });
  
}

$(document).ready(function(){
    setup();
});


