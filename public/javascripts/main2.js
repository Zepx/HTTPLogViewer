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
var statistics = new Konva.Layer();
stage.add(layer);
stage.add(urlLayer);
stage.add(ballLayer);
stage.add(statistics);

var centerX = stage.getWidth() / 2;

var MAX_IP = 5;
var MAX_URL = 30;
var ADDRESS_Y_SPACING = 100;
var URL_Y_SPACING = 20;

var timeoutID;
var addressCache = new LRUCache(MAX_IP);
var indexOfAddress = [];

for(i = 0; i < MAX_IP; i++) {
   indexOfAddress.push(i);
}

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
   });

   $('#stopAutoButton').click(function() {
      $(this).hide();
      $("#startAutoButton").show();
      stoppedButtonPressed = true;
   });
});

var doneAnimation = false;
function fetchNextLine2() {
   $.ajax( {
      url: 'process/next/25'
   }).done(function(data) {
//      listOfAddress = Array.apply(null, urlNodeBufferList).map(Number.prototype.valueOf,0);
      
      //When timeline completes, move on to the next batch call
      var tl = new TimelineLite({
         onComplete: function() {
            if(doneAnimation && !stoppedButtonPressed) {
               doneAnimation = false;
               timeoutID = window.setTimeout(fetchNextLine2(), 1000);
            }
         }
      });
      
      //Initialize Sub timeline
      var ipTimeline = [];
      for(i = 0; i < MAX_IP; i++) {
         ipTimeline[i] = new TimelineLite();
      }
      tl.add(ipTimeline); //All all sub timelines
      
      var ballTl = new TimelineLite();
      data.every(function(d) {
         if(d.status === false) { 
            return false;
         }
         
         //Reposition IPs in the Buffer if there are more than IPs that are waiting
         /*if(queueOfAddressNodes.length >= MAX_IP ) {
            queueOfAddress.shift();
            var removalNode = queueOfAddressNodes.shift();
            urlNodeBufferList[urlNodeBufferList.indexOf(removalNode)] = 0;
            
            tl.to(removalNode, 0.2, {
               konva: { x: -200 },
               onComplete: function() { removalNode.destroy(); },
            })
            
            //Shift nodes
            queueOfAddressNodes.forEach(function(e, i) {
               tl.to(e, 0.2, { konva: { y: i * ADDRESS_Y_SPACING } });
            });
         }*/
         
         //Reposition URLs in the Buffer if there are more than MAX_URL waiting
         /*if(queueOfUrlNodes.length >= MAX_URL ) {
            //listOfAddress.shift();
            queueOfUrl.shift();
            var removalUrlNode = queueOfUrlNodes.shift();
            tl.to(removalUrlNode, 0.5, {
               konva: { x: stage.getWidth() + 100 },
               onComplete: function() { removalUrlNode.destroy(); },
            }, 'urltext')
            
            //Shift nodes
            queueOfUrlNodes.forEach(function(e, i) {
               tl.to(e, 1, { konva: { y: i * URL_Y_SPACING }}, 'urltext', '+=0.2');
            });
            //tl.delay(2);
         }*/
         
         //Variables
         var ip = d.ip;
         var url = d.request;
         var code = d.statusCode;
         var randomC = randomColor({luminosity: 'light'});
         var addressNode = undefined;
         var addressIndex = -1;
         var urlIndex = -1
         var ball = null;
         
         //IP Addressses
         if((addressNode = addressCache.get(ip)) === undefined) {
            addressIndex = indexOfAddress.shift();
            var node = new Konva.Text({
               x: 25,
               y: addressIndex * ADDRESS_Y_SPACING,
               text: ip,
               fontSize: 13,
               fill: randomC
            });
            layer.add(node);
            tl.from(node, 1, { konva: { opacity: 0 }});
            
            //Cache is Full, Get Something Out
            if(addressIndex === undefined) {
               var oldEntry = addressCache.shift();
               var i = oldEntry.value.index;    
               var oldNode = oldEntry.value.node;
               
               addressCache.put(ip, { index: i, node: node });
               indexOfAddress.push(i);
               ipTimeline[i].to(oldNode, 0.5, {
                  konva: { x: -300 },
                  onComplete: function() { oldNode.destroy(); }
               });
            } else {
               addressCache.put(ip, { index: addressIndex, node: node });
            }
            
         } else { //Node exists in the cache
            var node = addressNode.node;
            var i = addressNode.index;
                 
            if(node.fontSize() < 20) {
               ipTimeline[i].to(node, 1, {
                  konva: {
                     fontSize: node.fontSize() + 10
                  }
               }, 0);
            }            
         }
         
         /*ball = new Konva.Circle({
            x: 150,
            y: nodeIndex * ADDRESS_Y_SPACING,
            radius: 5,
            fill: queueOfAddressNodes[nodeIndex].fill()
         });*/
         
         //URL Requests
         /*var urlNode = null;
         if((urlIndex = queueOfUrl.indexOf(url)) == -1) {
            var urlColor = randomColor({ luminosity: 'light' })
            urlIndex = queueOfUrl.length;
            
            urlNode = new Konva.Text({
               x: stage.getWidth()/2,
               y: urlIndex * URL_Y_SPACING,
               text: url,
               fontSize: 13,
               fontFamily: 'Calibri',
               fill: urlColor
            })
            
            urlLayer.add(urlNode);
            tl.from(urlNode, 0.2, { konva: { opacity: 0 }}, "urls").play();
            queueOfUrl.push(url);
            queueOfUrlNodes.push(urlNode);
         } else {
            var urlNode = queueOfUrlNodes[urlIndex];
         }
         
         ballLayer.add(ball);
         tl.to(ball, getRandomArbitrary(0.1, 2), {
            konva: {
               x: urlNode.x(),
               y: urlNode.y() + 5
            }
         }, "urls", "+=0.5").to(ball, getRandomArbitrary(0.1, 2), {
            konva: {
               x: -10,
               y: ball.y()
            },
            onComplete: function() {
               ball.destroy();
            }
         }, "returnBalls"); */
         
         tl.play();
         return true;
      });      
      doneAnimation = true;
      
   })
}

function fetchNextLine() {
   $.ajax( {
      url: 'process/next/25'
   }).done(function(data) {
      data.forEach(function(d) {
         if(d.status === true) {
            var code = d.statusCode;
            var ip = d.ip;
            var url = d.request;
            var x_pos = -1;
            var y_pos = -1;
            var x_tar = -1;
            var y_tar = -1;
            var randomC = randomColor({luminosity: 'light'});
            var ball = null;
            var ballTween = null;
            var timeNow = d.date;

            if(timeText != null)
               statistics.add(timeText).draw();
            
            var nodeIndex = -1;
            if((nodeIndex = listOfAddress.indexOf(ip)) == -1) {
               allAddress[ip] = 1;
               x_pos = 25;
               y_pos = y_counter;

               var node = new Konva.Text({
                  x: 25,
                  y: y_pos,
                  text: ip,
                  fontSize: 13,
                  fill: randomC
               })
               ball = new Konva.Circle({
                  x: 150,
                  y: y_counter,
                  radius: 5,
                  fill: randomC
               });

               y_counter = y_counter >= (MAX_SIZE * 100) ? 0 : y_counter + 100;         

               if(listOfAddress.length >= MAX_SIZE) {
                  listOfAddress.shift();                  
                  var removeNode = listOfNodes.shift();
                  removeNode.destroy();
                  layer.add(node);                  
                  listOfAddress.push(ip);
                  listOfNodes.push(node);
               } else {
                  listOfAddress.push(ip);
                  listOfNodes.push(node);
                  layer.add(node)
               }
            } else {
               allAddress[ip]++;
               var node = listOfNodes[nodeIndex];
               ball = new Konva.Circle({
                  x: 150,
                  y: node.y() + 15,
                  radius: 5,
                  fill: node.fill()
               });
               var size = node.fontSize();
               if(size < 20) {
                  TweenLite.to(node, 1, {
                     konva: {
                        fontSize: size + 10
                     }                        
                  });
               }
            }

            var urlIndex = -1
            if((urlIndex = listOfUrl.indexOf(url)) == -1) {
               var urlcolor = randomColor({ luminosity: 'light' })
               x_tar = stage.getWidth()/2;
               y_tar = y_counter2;

               var urlText = new Konva.Text({
                  x: x_tar,
                  y: y_tar,
                  text: url,
                  fontSize: 13,
                  fontFamily: 'Calibri',
                  fill: urlcolor
               });
               
               var statusCode = new Konva.Text({
                  x: x_tar - 20,
                  y: y_tar - 20,
                  text: code,
                  fontSize: 10,
                  fontFamily: 'Courier',
                  fill: 'yellow'
               })

               ballLayer.add(ball);
               
               var tl = new TimelineLite();
               tl.to(ball, getRandomArbitrary(0.1, 2), {
                     konva: {
                        x: x_tar,
                        y: y_tar + 5
                     },
                     onComplete: function() {
                        urlLayer.add(statusCode).draw();
                        TweenLite.to(statusCode, 1, {
                           opacity: 0,
                           onComplete: function() {
                              statusCode.destroy();
                           }
                        })
                     }
                  }).to(ball, getRandomArbitrary(0.1, 2), {
                     konva: {
                        x: -10,
                        y: ball.y()
                     },
                     onComplete: function() {
                        ball.destroy();
                     }
                  });
               
               y_counter2 = y_counter2 >= (20 * MAX_SIZE2) ? 0 : y_counter2 + 20;
               if(listOfUrl.length >= MAX_SIZE2) {                  
                  listOfUrl.shift();
                  var removeUrl = listOfUrlNodes.shift();
                  
                  var tl = new TimelineLite();
                  tl.to(removeUrl, 0.3, {
                     konva: {
                        x: stage.getWidth() + 100,                        
                     }
                  }).eventCallback('onComplete', function() {
                     removeUrl.destroy();
                     layer.add(urlText);
                     TweenLite.to(urlText, 1, {
                        opacity: 1
                     });
                  });

                  listOfUrl.push(url);
                  listOfUrlNodes.push(urlText);
               } else {
                  listOfUrl.push(url);
                  listOfUrlNodes.push(urlText);
                  layer.add(urlText)
               }
            }
            
            //Statistics
            var x_start = 25;
            var y_start = MAX_SIZE2 * 20 + 50;
            if(timeText == null) {
               timeText = new Konva.Text({
                  x: x_start,
                  y: y_start,
                  text: timeNow,
                  fill: 'white'
               });
            } else {
               timeText.text(timeNow);
            }            
            
         } else {
            clearInterval(intervalID);
         }            
      });
   });
}
   
function getRandomArbitrary(min, max) {
   return Math.random() * (max - min) + min;
}