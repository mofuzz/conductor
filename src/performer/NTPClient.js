var NTPClient = function(socket) {
  
  var roundtrips = [], MAX_TRIPS = 1000, currentServerTime = 0;
  
  var initializeRoundTrip = function() {
     socket.emit('ntp', {timeStamp: new Date().getTime() });
  }
  
  var analyzeRoundTrips = function(){
    if(roundtrips.length > 0){
      var totalRoundTripTime = 0;
      var totalServerTime = 0;
      $.each(roundtrips, function(i, trip) {
        totalServerTime += trip.serverRecievedTime;
        totalRoundTripTime += trip.clientReceivedTime - trip.clientSentTime;
      })
      var avgRoundtripTime = totalRoundTripTime / roundtrips.length;
      var lastRoundTrip = roundtrips[roundtrips.length - 1]
      var lastClientRecieveTime = lastRoundTrip.clientReceivedTime;
      var lastServerTime = lastRoundTrip.serverRecievedTime;
      var now = new Date().getTime();
      currentServerTime =  lastServerTime - avgRoundtripTime / 2 + now - lastClientRecieveTime;
      console.log("currentServerTime: " + new Date(currentServerTime));
    }
  }
  
  socket.on('ntp', function(data){
    console.log('ntp: ' + data);
    roundtrips.push($.extend( data, {clientReceivedTime: new Date().getTime()} ));
    if(roundtrips.length < MAX_TRIPS){
      initializeRoundTrip();
    }
    if(roundtrips.length % 10 == 0){
      analyzeRoundTrips();
    }
  });
  
  return {
    sync: function() {
     initializeRoundTrip();
    },
    getCurrentServerTime: function(){
      analyzeRoundTrips();
      return currentServerTime;
    }
  }
};