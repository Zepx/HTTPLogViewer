var Map = require('collections/map');
var SortedArray = require('collections/sorted-array');

var width = window.innerWidth;
var height = window.innerHeight;
var y_counter = 0;
var y_counter2 = 0;
var stoppedButtonPressed = false;

var stage = new Konva.Stage({
  container: 'container',
  width: width,
  height: height,
  y: 50
});

var layer = new Konva.Layer();
var urlLayer = new Konva.Layer();
var ballLayer = new Konva.Layer();
var statusLayer = new Konva.Layer();
var statsLayer = new Konva.Layer();
var labelLayer = new Konva.Layer();
stage.add(layer, urlLayer, ballLayer, statusLayer, statsLayer);
stage.add(labelLayer);

var centerX = stage.getWidth() / 2;

var MAX_IP = 10;
var MAX_URL = 30;
var ADDRESS_Y_SPACING = 60;
var URL_Y_SPACING = 20;
var TOP_ADDRESS = 5;
var TOP_URL = 5;

var timeoutID;
var addressBuffer = [];
var addressNodeBuffer = [];
var addressCounter = 0;

var urlBuffer = [];
var urlNodeBuffer = [];
var urlCounter = 0;

//Preparatory Nodes
var timeText = null;
var topNKonvaList = [];
var topNUrlKonvaList = [];
var allAddress = new Map();
var allUrl = new Map();
var colorStatusCode = new Map();

colorStatusCode.set('200', 'yellow');
colorStatusCode.set('404', '#FF6B6B');
colorStatusCode.set('301', '#00C9FF');

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
      text: "Statistics",
      x: centerX - 100,
      y: MAX_URL * URL_Y_SPACING + 25,
      fill: 'white',
      fontSize: 25,
      width: 200,
      align: 'center'
   });
   
   var topAddress = new Konva.Text({
      text: "Most Frequent " + TOP_ADDRESS + " Addresses (Page Hits)",
      x: centerX / 2 - centerX / 4,
      y: MAX_URL * URL_Y_SPACING + 75,
      fill: 'white',
      fontSize: 15,
      align: 'center',
      width: 200
   });
   
   var topUrl = new Konva.Text({
      text: "Most Frequent " + TOP_URL + " Requests (Page Hits)",
      x: centerX + (centerX / 2 - centerX / 4),
      y: MAX_URL * URL_Y_SPACING + 75,
      fill: 'white',
      fontSize: 15,
      align: 'center',
      width: 200
   });
   
   var clientAddress = new Konva.Text({
      text: "Client IP Addresses",
      x: centerX / 2 - centerX / 4,
      y: -25,
      fill: 'white',
      fontSize: 15,
      align: 'center',
      width: 200
   });
   
   var urlRequest = new Konva.Text({
      text: "URL Request Path",
      x: centerX + (centerX / 2 - centerX / 4),
      y: -25,
      fill: 'white',
      fontSize: 15,
      align: 'center',
      width: 200
   });
   
   timeText = new Konva.Text({
      x: centerX - 100,
      y: MAX_URL * URL_Y_SPACING + 100,
      fill: 'white',
      fontSize: 13,
      width: 200,
      align: 'center',
      text: 'Date Time'
   });   
   
   labelLayer.add(clientAddress, urlRequest, header, topAddress, topUrl);
   statsLayer.add(timeText);   
   labelLayer.draw();
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
         var dateTime = d.date;
         
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
            
            allAddress.set(ip, 1);
         } else {
            var node = addressNode = addressNodeBuffer[addressIndex];
            var freq = allAddress.get(ip) + 1;
            
            if(node.fontSize() < 20) {
               addressTimeline.to(node, 1, {
                  konva: {
                     fontSize: node.fontSize() + 10
                  }
               });
            }
            allAddress.set(ip, freq);
         }
         tl.add(addressTimeline, 0);
         
         //URL Requests
         var urlTimeline = new TimelineLite();
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
            
            allUrl.set(url, 1);
         } else {
            urlNode = urlNodeBuffer[urlIndex];
            var freq = allUrl.get(url) + 1;
            
            allUrl.set(url, freq);
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
            fill: colorStatusCode.get(code) || 'yellow'
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
               x: -30,
               y: addressNode.y() + 5,
               opacity: 0
            },
            onComplete: function() {
               ballKonva.destroy();
            }
         }, 'impactTime');
         tl.add(ballTimeline, 'urlFadeIn', '-=0.5');
         
         //Top Addresses
         var topN = getTopNItems(allAddress, TOP_ADDRESS);
         var topNTimeline = new TimelineLite();
         var nNodes = [];
         var oNodes = topNKonvaList;
         for(var i = 0; i < topN.length; i++) {
            var topNode = new Konva.Text({
               text: topN[i][0] + "\t\t\t\t\t" + topN[i][1],
               x: centerX / 2 - centerX / 4,
               y: (i * 20) + (MAX_URL * URL_Y_SPACING + 120),
               fontSize: 13,
               fontFamily: 'Calibri',
               fill: 'white',
               align: 'center',
               width: 200
            });
            nNodes[i] = topNode;
         }
         nNodes.forEach(function(e) { statsLayer.add(e); });
         topNTimeline.to(oNodes, 0.5, {
            konva: {
               opacity: 0
            },
            onComplete: function() {
               oNodes.forEach(function(e) { e.destroy() });
            }
         }, "initialTopN").from(nNodes, 0.5, {
            konva: {
               opacity: 0
            }
         }, "initialTopN", "+=0.5");
         tl.add(topNTimeline, 0);
         topNKonvaList = nNodes;
         
         //Top Url
         var topNUrl = getTopNItems(allUrl, TOP_URL);
         var topNUrlTimeline = new TimelineLite();
         var nUrlNodes = [];
         var oUrlNodes = topNUrlKonvaList;
         for(var i = 0; i < topNUrl.length; i++) {
            var topUrlNode = new Konva.Text({
               text: topNUrl[i][0],
               x: centerX + (centerX / 2 - centerX / 4),
               y: (i * 20) + (MAX_URL * URL_Y_SPACING + 120),
               fontSize: 13,
               fontFamily: 'Calibri',
               fill: 'white'               
            });
            nUrlNodes[i] = topUrlNode;
         }
         nUrlNodes.forEach(function(e) { statsLayer.add(e); });
         topNUrlTimeline.to(oUrlNodes, 0.5, {
            konva: {
               opacity: 0
            },
            onComplete: function() {
               oUrlNodes.forEach(function(e) { e.destroy() });
            }
         }, "initialTopNUrl").from(nUrlNodes, 0.5, {
            konva: {
               opacity: 0
            }
         }, "initialTopNUrl", "+=0.5");
         tl.add(topNUrlTimeline, 0);
         topNUrlKonvaList = nUrlNodes;
         
         //Current Time
         var dateTimeline = new TimelineLite();
         var oldTimeText = timeText;
         var newTimeText = new Konva.Text({
            x: centerX - 100,
            y: MAX_URL * URL_Y_SPACING + 100,
            fill: 'white',
            fontSize: 13,
            width: 200,
            align: 'center',
            text: dateTime
         });   
         statsLayer.add(newTimeText);
         dateTimeline.to(oldTimeText, 1, {
            konva: {
               opacity: 0
            },
            onComplete: function() {
               oldTimeText.destroy();
            }
         });
         dateTimeline.from(newTimeText, 1, {
            konva: {
               opacity: 0
            }
         })
         tl.add(dateTimeline, 0);
         timeText = newTimeText;
         tl.play();
         return true;
      });
      
      //Top N Addresses
      /*var topN = getTopNAddress(allAddress, 5);
      var index = -1;
      var nNodes = [];
      var topNTimeline = new TimelineLite();

      for(var i = 0; i < topN.length; i++) { 
         

         nNodes[i] = topNode;
      }
      statsLayer.add(nNodes).draw();
      topNTimeline.to(topNKonvaList, 0.5, {
         opacity: 0,
         x: -300,
         onComplete: function() {
            topNKonvaList[i].destroy()
         }
      }, 0).from(nNodes, 0.5, {
         opacity: 0,
         y: stage.getHeight() + 300
      }, 0);
      
      topNTimeline.play();      */
      doneAnimation = true;
   })
}

function getRandomArbitrary(min, max) {
   return Math.random() * (max - min) + min;
}

function getTopNItems(map, n) {
   if(map == undefined) {
      throw new Error("Map object cannot be empty!")
   }
   
   var reverseCompare = function(a, b) {
      if(a[1] > b[1])
         return -1;
      else if(a[1] < b[1])
         return 1;
      else
         return 0;
   }
   
   var equals = function(a, b) {
      return a[1] == b[1];
   }
   
   var sortedTop = new SortedArray(map.entries(), equals, reverseCompare);
   return topN = sortedTop.splice(0,n);
}