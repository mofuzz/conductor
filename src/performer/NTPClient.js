var NTPClient = function(socket) {
  
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
    
    console.log("new RoundTrip. latency is: " + self.getCommunicationLatency() + "offset is: " + self.getTimeOffset());
    
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
      if(trip.getCommunicationLatency < fastestRoundTrip.getCommunicationLatency){
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
    }
  };
  
  return self;
};