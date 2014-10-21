var GridGUI = function() {
  var GRID_DIMENSIONS = {x: 10, y:10}
  var touchResponders = [];

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
  
  var squareWidth = $(document).width() / GRID_DIMENSIONS.x;
  var squareHeight = $(document).height() / GRID_DIMENSIONS.y;
  
  var colors = [ "#cccccc", "#dddddd"];
 
  for (var x=0; x < GRID_DIMENSIONS.x; x++) {
    for (var y=0; y < GRID_DIMENSIONS.y; y++) {
      (function() {
        var localX = x, localY = y;
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
          $(touchResponders).each(function(i, responder) {
            responder(localX,localY);
          });
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
      })()
    };
  };
  
  var self = {
    GRID_DIMENSIONS: GRID_DIMENSIONS,
    addTouchResponder: function(responder) {  touchResponders.push(responder) }
  }
  
  return self;
  
}