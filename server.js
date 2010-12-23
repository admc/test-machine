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

// Module deps
var express = require('express');
var sys = require('sys');
var soda = require('soda')
  , assert = require('assert');
var request = require('request')
  , jsdom = require('jsdom');  
var http = require('http')
  , io = require('socket.io')
  , fs = require('fs');

var app = module.exports = express.createServer();

// Configuration
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.use(express.bodyDecoder());
    app.use(express.methodOverride());
    app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(app.router);
    app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
   app.use(express.errorHandler()); 
});

app.set('view options', {
  layout: false
});

// Routes
app.get('/', function(req, res) {
  res.render('index.ejs');
});

var runTest = function(test, url, client, configObj) {   
  var browser = soda.createSauceClient({
      'url': url
    , 'username': configObj.SAUCE_USERNAME
    , 'access-key': configObj.SAUCE_ACCESS_KEY
    , 'os': 'Linux'
    , 'browser': 'firefox'
    , 'browser-version': '3.'
    , 'max-duration': 300 // 5 minutes
    , 'public': true
    , 'name': 'Test Machine'
  });
  
  browser.on('command', function(cmd, args) {
    if (cmd != 'getNewBrowserSession') {
      client.send( JSON.stringify({
        task:"showCmd", 
        cmd:cmd, 
        args:args.join(', ')}) 
      );
    }
    else {
      client.send( JSON.stringify({
          task:"showCmd", 
          cmd:"Establishing a connection", 
          args:""
        }) 
      );
    }
    console.log(' \x1b[33m%s\x1b[0m: %s', cmd, args.join(', '));
  });
  
  browser
    .chain
    .session()
    .setTimeout(20000);
    
  client.send( JSON.stringify({
      task:"showCmd", 
      cmd:"Test Started", 
      args:""
    }) 
  );
  
  // Add each of the actions to soda
  for (var i=0;i<test.length;i++) {
    var obj = test[i];
    browser.and(function(browser) {
      if (obj.text){
        browser[obj.method](
          obj.value.toString(), 
          obj.text
        );
      }
      else {
        browser[obj.method](obj.value.toString());
      }
    });
  }
  
  browser
    .testComplete()
    .end(function(err){
      client.send( JSON.stringify({
          task:"showCmd", 
          cmd:"Test Done", 
          args:"", 
          sid:this.sid
        }) 
      );
    });
};

var createTest = function(url, client) {
  var page = [];
  page.push({
    method:"open", 
    value:url, 
    attrib:"url"
  });
  page.push({
    method:"waitForPageToLoad", 
    value:20000, 
    attrib:false
  });

  var queryForTag = function(w, tag, attrib, method) {
    w.jQuery(tag).each(function (index, value) {
      if (index > 4){ return; }
      
      var actionObj = {};
      actionObj.method = method;
      
      if (typeof attrib != "string") {
        w.jQuery(attrib).each( function(i, v) {
          if (value[v] != "") {
            actionObj.attrib = v;
          }
        });
      }
      else { actionObj.attrib = attrib; }
      
      if ((tag == ":text:visible") ||
          (tag == "textarea:visible")) {
        page.push({
          method:"type", 
          value:value[actionObj.attrib], 
          attrib:actionObj.attrib, 
          text:"testing"
        });
        
        actionObj.text = "testing";
      }
      
      var clean = value[actionObj.attrib]
      if (actionObj.attrib == "innerHTML") {
        clean = value[actionObj.attrib].replace(/<.*?>/g, '');
        clean = clean.replace(/^\s+|\s+$/g, '');
      }
      if (actionObj.attrib && 
          (value.type != "hidden")) {
            
        if (tag == "a:visible") {
          clean = "link="+clean;
        }
        actionObj.value = clean;
        page.push(actionObj);
      }
    });
  }
  
  request({uri:url}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var window = jsdom.jsdom(body).createWindow();
      jsdom.jQueryify(window, 'http://code.jquery.com/jquery-1.4.2.min.js', function (window, jquery) {
        // jQuery is now loaded on the jsdom window created from 'body'
        queryForTag(window, 'title', 'innerHTML', 'verifyTitle');
        queryForTag(window, 'a:visible', 'innerHTML', 'verifyElementPresent');
        queryForTag(window, 'textarea:visible', ['id','name'], 'verifyValue');
        queryForTag(window, ':text', ['id','name'], 'verifyValue');
        queryForTag(window, ':submit:visible', ['id','name'], 'verifyElementPresent');
        queryForTag(window, ':button:visible', ['id','name'], 'verifyElementPresent');
        queryForTag(window, 'h1:visible', 'innerHTML', 'verifyTextPresent');
        queryForTag(window, 'h2:visible', 'innerHTML', 'verifyTextPresent');
        queryForTag(window, 'h3:visible', 'innerHTML', 'verifyTextPresent');
        client.send( JSON.stringify({
            task:"showTest",
            page:page,
            url:url
          })
        );
      })
    }
    else {
      client.send( JSON.stringify({
        task:"showError", 
        error:"The provided URL was unaccessible."}) 
      );
    }
  })
};

fs.readFile(process.env.HOME+'/.tmrc', encoding='utf8', function(err, data) {
  if (err){
    console.log("We weren't able to find a ~/.tmrc config file, please create.");
    return;
  }
  var configObj = JSON.parse(data);

  if (!configObj.TEST_MACHINE_PORT) {
    console.log("Please define a TEST_MACHINE_PORT in your ~/.tmrc file.");
    return;
  }
  
  if (!configObj.SAUCE_USERNAME) {
    console.log("Please define a SAUCE_USERNAME in your ~/.tmrc file.");
    return;
  }
  
  if (!configObj.SAUCE_ACCESS_KEY) {
    console.log("Please define a SAUCE_ACCESS_KEY in your ~/.tmrc file.");
    return;
  }
  
  // Listen
  if (!module.parent) {
    app.listen(configObj.TEST_MACHINE_PORT);
    console.log("Express server listening on port %d", app.address().port)
  }

  var io = require('socket.io')
  var io = io.listen(app)
    , buffer = [];

  //socket.io
  io.on('connection', function(client) {
    //client.broadcast({ announcement: client.sessionId + ' connected' });

    client.on('message', function(message) {
      var obj = JSON.parse(message);
      if (obj.task == "create") {
        createTest(obj.url, client);
      }
      if (obj.task == "run") {
        runTest(obj.page, obj.url, client, configObj);
      }
    });

    // client.on('disconnect', function(){
    //   client.broadcast({ announcement: client.sessionId + ' disconnected' });
    // });
  });
});

