/*
Copyright 2010, Sauce Labs

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 
 Authors:
 Adam Christian - adam.christian@gmail.com
*/

if (typeof jqwizard == "undefined") { var jqwizard = {}; }

// Sane defaults
jqwizard.imagesPath = "./images/jqwizard"
jqwizard.screen = "intro";

jqwizard.defaultButtons = {
  "Back": function() { jqwizard.morphDialog("intro"); },
  "Continue": function() { jqwizard.morphDialog("thanks"); }
};
//Outline the basic structure of the wizard
jqwizard.layout = {
  intro: {
    buttons: {
      "No Thanks": function() { $(this).dialog("close"); },
      "Continue": function() { jqwizard.morphDialog("stepTwo"); }
    },
    init: function() { if (!jqwizard.os) { $(".jqwOS").html(jqwizard.getOS()); } }
  }
};

//Get content for a specified screen
jqwizard.getContent = function(screen) {
  var content = '';
  // OS specific content div
  var contentOSDiv = $('#jqw'+screen.charAt(0).toUpperCase() + screen.slice(1)+jqwizard.os);
  // Fall back to non OS specific
  var contentDiv = $('#jqw'+screen.charAt(0).toUpperCase() + screen.slice(1));

  if (contentOSDiv.length != 0) {
    content = contentOSDiv.html();
  }
  else if (contentDiv.length != 0) {
    content = contentDiv.html();
  }
  else {
    content = "Could not find the contents of this slide!";
  }
  return content;
};

//Initialize a the jqw start dialog without any content
//then initialize it to the intro step
jqwizard.init = function(title) {
  if (!title) {
    var title = "jQuery Wizard!"
  }
  var jqwDiv = document.getElementById('jqwDiv');
  if (!jqwDiv){
    jqwDiv = document.createElement('div');
    jqwDiv.id = 'jqwDiv';

    var content = document.createElement('div');
    content.id = 'jqwContent';
    content.style.padding = "10px";
    content.style.margin = "10px";
    jqwDiv.appendChild(content);
    jqwizard.jqwContent = content;

    document.body.appendChild(jqwDiv);
    jqwizard.jqDialog = $(jqwDiv).dialog({
      autoOpen: false,
      modal: true, height:500,
      width:750, resizable:false,
      title: title,
      draggable:false,
      zIndex:3000,
      close: function(ev, ui) {
        $(this).dialog("destroy");
        $("#jqwDiv").remove();
      }
    });
  }

  //Hack to keep flash from showing through
  jqwizard.jqDialog.dialog("open");
  jqwizard.morphDialog('intro');
};

//Get buttons for the provided screen,
//default to lang buttons
jqwizard.getButtons = function(screen) {
  var screenObj = jqwizard.layout[screen];
  var buttons = jqwizard.defaultButtons;
  if (screenObj) {
    buttons = screenObj.buttons;
  }
  return buttons;
};

//Set a dialogs content and buttons
jqwizard.morphDialog = function(screen) {
  $("#jqwContent").html(jqwizard.getContent(screen));
  jqwizard.jqDialog.dialog("option",
    "buttons", jqwizard.getButtons(screen));

  //if there is a defined init function for the screen, run it
  if (jqwizard.layout[screen] && 
      jqwizard.layout[screen].init){
    jqwizard.layout[screen].init();
  }
  jqwizard.screen = screen;

  //keep those buttons small
  //$(".ui-dialog-buttonpane").css({"font-size":"12px", "text-align":"right"});
  $(".jqwExpand").css({height:"15px", overflow:"hidden",
                          "margin-top":"5px", "margin-bottom":"5px"});

  var expandArrow = document.createElement("img");
  expandArrow.className = "jqwExpandArrow";
  expandArrow.style.padding = "5px";
  expandArrow.src = jqwizard.imagesPath + "/arrow_down.png";
  $(".jqwMeat:visible").find(".jqwExpand").prepend(expandArrow);

  $(".jqwExpand").click(function() {
    if (this.style.height == "15px") {
      $(this).css({height:"", overflow:""});
      $(this).find(".jqwExpandArrow:visible")[0].src = jqwizard.imagesPath + "/arrow_up.png";
    }
    else {
      $(this).css({height:"15px", overflow:"hidden"});
      $(this).find(".jqwExpandArrow:visible")[0].src = jqwizard.imagesPath + "/arrow_down.png";
    }
  });
  $(".jqwNav").mouseover(function() {
    if (!$(this).hasClass("current")){
      $(this).css({background:"white"});
    }
  });
  $(".jqwNav").mouseout(function() {
    if (!$(this).hasClass("current")){
      $(this).css({background:""});
    }
  });
  $(".jqwNav").click(function() {
    $(".jqwNav").removeClass("current");
    //Move the arrow
    var imgTag = $(this).parent().find("img")[0];
    var imgTagDetached = imgTag.parentNode.removeChild(imgTag);
    //Style the newly selected nav
    $(this).find(".jqwArrow")[0].appendChild(imgTagDetached);
    $(this).addClass("current");
    $(this).css({background:""});
    //Get the framework from name attrib
    //Show the corresponding framework div
    $(".jqwMeat:visible").find(".jqwFramework").css({display:"none"})
    $(".jqwMeat:visible").find("."+this.getAttribute("name")).css({display:"inline"})
  });
};

//Figure out the users OS
jqwizard.getOS = function() {
  var os = null;
  var ua = navigator.userAgent.toLowerCase();
  if (ua.indexOf("win") != -1) {
    os = "Windows";
  } else if (ua.indexOf("mac") != -1) {
    os = "Macintosh";
  } else if (ua.indexOf("linux") != -1) {
    os = "Linux";
  } else if (ua.indexOf("x11") != -1) {
     os = "Unix";
  }
  jqwizard.os = os;
  return os;
};

//Build a display allowing the user to
//select their OS
jqwizard.selectOS = function() {
  var osDiv = document.createElement('div');
  osDiv.style.border = "1px solid black";
  osDiv.style.left = "200px";
  osDiv.style.top = "150px";
  osDiv.style.height = "150px";
  osDiv.style.width = "375px";
  osDiv.style.position = "absolute";
  osDiv.style.backgroundColor = "#fff";

  var winDiv = document.createElement('div');
  winDiv.className = "osColumn";
  winDiv.id = "Windows";
  var win = document.createElement('img');
  win.src = jqwizard.imagesPath + "/os_logo/win.png";
  winDiv.appendChild(win);

  var macDiv = document.createElement('div');
  macDiv.className = "osColumn";
  macDiv.id = "Macintosh";
  var mac = document.createElement('img');
  mac.src = jqwizard.imagesPath + "/os_logo/mac.png";
  macDiv.appendChild(mac);

  var linuxDiv = document.createElement('div');
  linuxDiv.className = "osColumn";
  linuxDiv.id = "Linux";
  var linux = document.createElement('img');
  linux.src = jqwizard.imagesPath + "/os_logo/linux.png";
  linuxDiv.appendChild(linux);

  osDiv.appendChild(winDiv);
  osDiv.appendChild(macDiv);
  osDiv.appendChild(linuxDiv);

  $("#jqwContent")[0].appendChild(osDiv);
  $(".osColumn").css({float:"left", padding:"14px", margin:"10px"});
  $(".osColumn").mouseover(function() {
    $(this).css({border:"2px dashed #c9e6f0"});
  });
  $(".osColumn").mouseout(function() {
    $(this).css({border:"0px solid white"});
  });
  $(".osColumn").click(function() {
    var jqwOS = $(".jqwOS");
    if (jqwOS.length > 0){
      jqwOS.html($(this)[0].id);
    }
    jqwizard.os = $(this)[0].id;
    osDiv.style.display = "none";
  });
};

//Display a screen shot
jqwizard.screenshot = function(screenShotURL) {
  var ssDiv = document.getElementById('jqwScreenshot');
  if (!ssDiv){
    ssDiv = document.createElement('div');
    ssDiv.id = "jqwScreenshot";
    ssDiv.style.border = "1px solid black";
    ssDiv.style.left = "150px";
    ssDiv.style.top = "10px";
    ssDiv.style.position = "absolute";
    ssDiv.style.padding = "20px";
    ssDiv.style.backgroundColor = "#fff";
    ssDiv.innerHTML = $("#jqwScreenshotContent").html();

    var close = document.createElement('div');
    $(close).css({
      fontSize: "12px",
      position:"absolute",
      top:"90%",
      left:"45%",
      color:"#8A8A8A",
      "text-decoration":"underline",
      cursor:"pointer",
    });
    close.innerHTML = "Close";
    $(close).click(function() {
      $(this).parent().remove();
    });

    ssDiv.appendChild(close);
    jqwizard.jqwContent.parentNode.appendChild(ssDiv);
  }
  var ssImg = document.createElement('img');
  $(ssImg).css({padding:"10px", margin:"10px", border:"1px solid #C1C1C1"});
  ssImg.src = screenShotURL;
  ssDiv.appendChild(ssImg);
  ssDiv.style.display = "";
};

jqwizard.video = function(embedURL) {
  var embedDiv = document.getElementById('jqwVideo');
  if (!embedDiv){
    embedDiv = document.createElement('div');
    embedDiv.id = "jqwVideo";
    embedDiv.style.border = "1px solid black";
    embedDiv.style.left = "150px";
    embedDiv.style.top = "10px";
    embedDiv.style.position = "absolute";
    embedDiv.style.padding = "20px";
    embedDiv.style.margin = "10px";
    embedDiv.style.backgroundColor = "#fff";
    embedDiv.innerHTML = $("#jqwVideoContent").html();

    var close = document.createElement('div');
    $(close).css({
      fontSize: "12px",
      position:"absolute",
      top:"95%",
      left:"45%",
      color:"#8A8A8A",
      "text-decoration":"underline",
      cursor:"pointer",
    });
    close.innerHTML = "Close";
    $(close).click(function() {
      $(this).parent().remove();
    });

    embedDiv.appendChild(close);
    jqwizard.jqwContent.parentNode.appendChild(embedDiv);
  }
  var vidEmbed = document.createElement('embed');
  $(vidEmbed).css({width:"437px", height:"315px",
    padding:"10px", margin:"10px", border:"1px solid #C1C1C1"});
  vidEmbed.src = embedURL;
  vidEmbed.name = "jqwVideo";
  vidEmbed.allowfullscreen = "true";
  vidEmbed.allowscriptaccess="always";
  embedDiv.appendChild(vidEmbed);
  embedDiv.style.display = "";
};

jqwizard.kill = function() {
  jqwizard.jqDialog.dialog("destroy");
  $("#jqwDiv").remove();
};
