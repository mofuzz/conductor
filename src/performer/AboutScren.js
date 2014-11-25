var AboutScreen = function() {
  
  $(document).ready(function(){
    var windowJQ = $(window);
    var about = $("#about");
    var margin = 100;
    var isDisplayed = false;
    var toggleBtn = about.find(".toggleBtn");
    var getRightShiftForHide = function() {
      return $(window).width() - toggleBtn.outerWidth();
    }
    about.find(".toggleBtn").click(function() {
      var left = isDisplayed? getRightShiftForHide(): margin;
      about.animate({
        left: left + "px"
      }, 100);
      about.find(".toggleBtn .widthHolder").html(isDisplayed ? "?" : "x");
      isDisplayed = !isDisplayed;
    })

    about.css({
      left: getRightShiftForHide() + "px",
      width: ($(window).width() - (margin * 2)) + "px",
    });

    about.find(".content").css({
      height: ($(window).innerHeight() - (margin * 2)) + "px",
      width: (about.width() - about.find(".toggleBtn").outerWidth() - 5) + "px"
    });

  });
  
  return {
    connectCounter: function(value) {
      $("#currentChoirCount").html(value);
    },
    maxEverConnected: function(value) {
      $("#maxChoirCount").html(value);
    }
    

  }  
  
}

