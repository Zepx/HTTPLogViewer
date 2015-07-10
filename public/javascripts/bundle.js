(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var width = window.innerWidth;
var height = window.innerHeight;
var y_counter = 0;
var y_counter2 = 0;
var stoppedButtonPressed = false;

var stage = new Konva.Stage({
  container: 'container',
  width: width,
  height: height
});

var layer = new Konva.Layer();
var urlLayer = new Konva.Layer();
var ballLayer = new Konva.Layer();
var statusLayer = new Konva.Layer();
var statsLayer = new Konva.Layer();
stage.add(layer);
stage.add(urlLayer);
stage.add(ballLayer);
stage.add(statusLayer);
stage.add(statsLayer);

var centerX = stage.getWidth() / 2;

var MAX_IP = 10;
var MAX_URL = 30;
var ADDRESS_Y_SPACING = 60;
var URL_Y_SPACING = 20;

var timeoutID;
var addressBuffer = [];
var addressNodeBuffer = [];
var addressCounter = 0;

var urlBuffer = [];
var urlNodeBuffer = [];
var urlCounter = 0;

//Preparatory Nodes
var timeText = null;
var allAddress = {};

$(document).ready(function() {
   $.ajax( {
      url: 'process/filelist',
   }).done(function(data) {
      if(data) {
         data.forEach(function(ele, index) {
            $ele = $('<option>' + ele + '</option>').val(ele)
            $('[name=logfile]').append($ele);
         });
      }
   })

   $('[name=logfile]').on('change', function() {
      var logfile = $(this).val();

      $.ajax( {
         url: 'process/log/' + logfile,
      }).done(function(data) {
         if(data.status === true) {
            $('#startAutoButton').show();
         }
      })
   })

   $('#startAutoButton').click(function() {
      $(this).hide();
      $("#stopAutoButton").show();
      //intervalID = window.setInterval(fetchNextLine, 2000);
      timeoutID = window.setTimeout(fetchNextLine2(), 1000);
      stoppedButtonPressed = false;
      
      initializeStatistics();
   });

   $('#stopAutoButton').click(function() {
      $(this).hide();
      $("#startAutoButton").show();
      stoppedButtonPressed = true;
   });
});

function initializeStatistics() {
   var header = new Konva.Text({
      text: "Stats",
      x: centerX,
      y: MAX_URL * URL_Y_SPACING + 25,
      fill: 'white',
      fontSize: 15      
   });
   statsLayer.add(header);
   
   statsLayer.draw();
}

var doneAnimation = false;
function fetchNextLine2() {
   $.ajax( {
      url: 'process/next/25'
   }).done(function(data) {
      //When timeline completes, move on to the next batch call
      var tl = new TimelineLite({
         onComplete: function() {
            if(doneAnimation && !stoppedButtonPressed) {
               doneAnimation = false;
               timeoutID = window.setTimeout(fetchNextLine2(), 1000);
            }
         }
      });
      
      data.every(function(d) {
         if(d.status === false) { 
            return false;
         }
         
         //Variables
         var randomC = randomColor({luminosity: 'light'});
         var ip = d.ip;
         var url = d.request;
         var code = d.statusCode;
         var addressNode = undefined;
         var addressIndex = -1;
         var urlNode = undefined;
         var urlIndex = -1
         
         //IP Addressses
         var addressTimeline = new TimelineLite();
         if((addressIndex = addressBuffer.indexOf(ip)) == -1) {
            //Check if buffer is full
            if(addressBuffer.length >= MAX_IP) {
               //Reset the counter if it is at the maximum
               addressCounter = addressCounter >= MAX_IP ? 0 : addressCounter;
               var oldNode = addressNodeBuffer[addressCounter];
               addressTimeline.to(oldNode, 0.5, {
                  konva: { x:  -300},
                  onComplete: function() { oldNode.destroy(); }
               });
            }
            
            var node = new Konva.Text({
               x: 25,
               y: addressCounter * ADDRESS_Y_SPACING,
               text: ip,
               fontSize: 13,
               fill: randomC
            });
            layer.add(node);
            //ipTimeline[addressCounter].from(node, 1, { konva: { opacity: 0 }});
            addressTimeline.from(node, 1, { konva: { opacity: 0 }});
            addressBuffer[addressCounter] = ip;
            addressNodeBuffer[addressCounter] = addressNode = node;            
            addressIndex = addressCounter++;
         } else {
            var node = addressNode = addressNodeBuffer[addressIndex];
            
            if(node.fontSize() < 20) {
               addressTimeline.to(node, 1, {
                  konva: {
                     fontSize: node.fontSize() + 10
                  }
               });
            }     
         }
         tl.add(addressTimeline, 0);
         
         //URL Requests
         var urlTimeline = new TimelineLite();
         console.log(url);
         if((urlIndex = urlBuffer.indexOf(url)) == -1) {
            //Check if buffer is full
            if(urlBuffer.length >= MAX_URL) {
               //Reset the counter if it is at the maximum
               urlCounter = urlCounter >= MAX_URL ? 0 : urlCounter;
               var oldNode = urlNodeBuffer[urlCounter];
               urlTimeline.to(oldNode, 0.5, {
                  konva: { x: stage.getWidth() + 300 },
                  onComplete: function() { oldNode.destroy(); }
               });
            }
            
            var node = new Konva.Text({
               x: stage.getWidth()/2,
               y: urlCounter * URL_Y_SPACING,
               text: url,
               fontSize: 13,
               fill: randomC
            });
            urlLayer.add(node);
            //ipTimeline[addressCounter].from(node, 1, { konva: { opacity: 0 }});
            urlTimeline.from(node, 1, { konva: { opacity: 0 }}, 'urlFadeIn');
            urlBuffer[urlCounter] = url;
            urlNodeBuffer[urlCounter] = urlNode = node;
            urlIndex = urlCounter++;            
         } else {
            urlNode = urlNodeBuffer[urlIndex];
         }
         tl.add(urlTimeline, 0);
         
         //Balls & Request Code
         var ballTimeline = new TimelineLite();
         var ballKonva = new Konva.Circle({
            x: 150,
            y: addressIndex * ADDRESS_Y_SPACING,
            radius: 5,
            fill: addressNode.fill()
         });
         
         var statusKonva = new Konva.Text({
            x: urlNode.x() - 20,
            y: urlNode.y(),
            text: code,
            fontsize: 11,
            fill: 'yellow'
         });
         ballLayer.add(ballKonva);
         
         var bounceSpeed = getRandomArbitrary(0.1, 2);
         ballTimeline.to(ballKonva, getRandomArbitrary(0.1, 2), {
            konva: {
               x: urlNode.x(),
               y: urlNode.y() + 5
            },
            onComplete: function() {
               statusLayer.add(statusKonva);
            }
         }).to(statusKonva, bounceSpeed, {
            konva: {
               opacity: 0,
               x: statusKonva.x() - 25
            },
            onComplete: function() {
               statusKonva.destroy();
            }
         }, 'impactTime').to(ballKonva, bounceSpeed, {
            konva: {
               x: -10,
               y: addressNode.y()
            },
            onComplete: function() {
               ballKonva.destroy();
            }
         }, 'impactTime');
         tl.add(ballTimeline, 'urlFadeIn', '-=0.5');
         
         tl.play();
         return true;
      });      
      doneAnimation = true;
   })
}

function getRandomArbitrary(min, max) {
   return Math.random() * (max - min) + min;
}
},{}]},{},[1]);
