$(document).ready(function() {
  
  //connect to localhost
  window.socket = new io.Socket(window.location.hostname);
  socket.connect();
  socket.on('message', function(data) {
      var obj = JSON.parse(data);
      if (obj.task == "showTest") {
        showTest(obj.page, obj.url);
        window.socket.send(
          JSON.stringify({
            task:"run",
            url:obj.url,
            page:obj.page
          })
        );
      }
      if (obj.task == "showCmd") {
        $("#status").html( obj.cmd + " " + obj.args + "..." );

        if (obj.cmd == "Test Done") {
          runTest(obj);
          enableInputs();
        }
        else {
          var curr = $(".current");
          //Scroll there automatically
          $('#testContainer').attr("scrollTop", curr.attr("offsetTop"));            
          if (curr.length == 0) {
            $("#testContainer").children().first().removeClass("default");
            $("#testContainer").children().first().addClass("current");
          }
          else {
            var next = curr.next();
            next.removeClass("default");
            next.addClass("current");
            curr.removeClass("current");
            curr.addClass("finished");
          }
        }
      }
      if (obj.task == "showError") {
        alert(obj.error);
        enableInputs();
      }
  });

  //Enable the inputs UI
  var enableInputs = function() {
    $("#url")[0].disabled = false;
    $("#url")[0].value = "";
    $("#submitButton")[0].style.display = "block";
    $("#centerMsg").html("Enter your URL into the box, then press 'GO'.")
  }
  
  //Generate a test div from the array
  var showTest = function(page, url) {
      var testContainer = $("<div>");
      testContainer.attr("id", "testContainer");
      testContainer.css("overflow", "auto");
      
      $.each(page, function(index, value) {
        var entryDiv = $("<div>");
        entryDiv.addClass("default");
        if (value.text) {
          entryDiv.html("<div>"+value.method+
            "</div> <div>"+value.value+
            "</div><div>"+value.text+
            "</div>");
        }
        else {
          entryDiv.html("<div>"+value.method+
            "</div> <div>"+
            value.value+
            "</div>"); 
        }
        testContainer.append(entryDiv);
      });
      
      //Full screen overlay
      var full = $("<div>");
      full.attr("id", "full");
      full.addClass("overlay");
      $(document.body).append(full);
      
      //Test container dialog
      $(document.body).append(testContainer);
      testContainer.dialog({
        "title": "Your "+url+" Test", 
        width: 460, 
        height:550, 
        zIndex: 30, 
        position:[0,0]}
      );
      
      //Test run status div
      var status = $("<div>");
      status.attr("id", "status");
      $(document.body).append(status);
      status.dialog({
        "title": "Test Status", 
        width: 450, 
        height:200, 
        zIndex: 40}
      );
      status.html("Establishing a connection...");
  }
  
  //Add a dialog containing the ondemand test run
  var runTest = function(obj) {
    var ifContainer = $("<div>");
    ifContainer.attr("id", "sauceContainer");
    ifContainer.css("overflow", "hidden");
    var iframe = $("<iframe>");
    iframe.attr("id", "sauceIframe")
    iframe.attr("src", "https://saucelabs.com/jobs/"+ obj.sid)
    iframe.css({
      position:"absolute",
      top:"00px",
      left:"00px",
      width:"100%",
      height:"100%"
    })
    
    ifContainer.append(iframe);
    $(document.body).append(ifContainer);
    ifContainer.dialog({
      "title":"The Sauce", 
      width: 900, 
      height:550, 
      zIndex: 50}
    );
    
     var doRedirect  = function() {
       $("#sauceIframe")[0].src = "https://saucelabs.com/jobs/"+ obj.sid+"/";
       $("#full").remove();
     }
     setTimeout(doRedirect, 10000);
  }
});

$('#url').bind('keypress', function(e) {
  if (e.keyCode == $.ui.keyCode.ENTER) {
    submitUser();
  }
});

var page = [];
var url = null;

var submitUser = function() {
  function isUrl(s) {
  	var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
  	return regexp.test(s);
  }
  
  var url = $("#url").attr("value");
  if (url == "") {
    return;
  }
  if (!isUrl(url)){
    alert("Please enter a valid URL..");
    return;
  }
  
  $("#url")[0].disabled = true;
  $("#url")[0].value = "Crunching, please wait.."
  $("#submitButton")[0].style.display = "none";
  $("#centerMsg").html("<b>Please be patient!</b><br><br>Generating tests and launching VM's <br> can take some time...")
  window.socket.send(
    JSON.stringify({
      task:"create", 
      url:url
    })
  );      
}