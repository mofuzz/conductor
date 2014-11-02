var KnobsUI = function(container) {
  
  var controls = [
    {
      name: "volume",
      type: "scalar",
      min: 0,
      max: 1
    }
  ]
  
  var Knob = function(options) {
    var domObj = $(ColorChoirApp.templates.knob({name: "blah"}));

    container.append(  domObj );
    domObj.find("input").knob({
        'min':0,
        'max':1,
        'step': 0.001
    });
  }
  
 
  Knob();
  
  var self = {
    
  };
  
  return self;
}