// ===============================
// =          Messaging          =
// ===============================

var PopupMessage = function() {
  
  var message = function(text) {
    var BORDER = 20, 
      messageDiv = $("#message"),
      win = $(window);
    messageDiv.show();
    messageDiv.css({
      top: BORDER, 
      left:BORDER, 
      width: win.width() - 2 * BORDER, 
      height: win.height() - 2 * BORDER
    })

    var txt = messageDiv.find(".text")

    txt
      .text(text)
      .css({
      left: (win.width() - txt.width())/2,
      top: (win.height() - txt.height())/2
    });
    $("#bounds").hide();
  }

  var clearMessage = function() {
    $("#message").hide();
    $("#bounds").show();
  }

  var isMessageVisible = function() {
    return $("#message").is(":visible");
  }

  return {
    message: message,
    clearMessage: clearMessage,
    isMessageVisible: isMessageVisible
  }
  
}
