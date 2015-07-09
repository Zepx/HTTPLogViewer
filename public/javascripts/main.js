var width = window.innerWidth;
var height = window.innerHeight;
var color = randomColor();
var y_counter = 0;
var y_counter2 = 0;

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

/*var rect = new Konva.Rect({
  x: stage.getWidth() / 2,
  y: stage.getHeight() / 2,
  fill: '#BF4E4E',
  stroke: 'black',
  strokeWidth: 2,
  width: 100,
  height: 25
});*/

//layer.add(rect);
//stage.add(layer);

var amplitude = 350;
var period = 2000;
// in ms
var centerX = stage.getWidth() / 2;

var anim = new Konva.Animation(function(frame) {
  rect.setX(amplitude * Math.sin(frame.time * 2 * Math.PI / period) + centerX);
}, layer);

//anim.start();
var MAX_SIZE = 5;
var MAX_SIZE2 = 30;
var intervalID;
var mapOfAddress = {};
var listOfUrl = [];
var listOfUrlNodes = [];
var listOfAddress = [];
var listOfNodes = [];

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
      intervalID = window.setInterval(fetchNextLine, 2000);
   });

   $('#stopAutoButton').click(function() {
      $(this).hide();
      $("#startAutoButton").show();
      clearInterval(intervalID);
   });
});

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
            var ball2 = null;
            var ballTween = null;
            var ballTween2 = null;
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
                  /*new Konva.Tween({
                     node: removeNode,
                     x: -100,
                     duration: 0.2,
                     onFinish: function() {
                        removeNode.destroy();
                        layer.add(node);
                     }
                  }).play();
*/
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
                  /*var tween = new Konva.Tween({
                     node: node,
                     duration: 1,
                     fontSize: size + 10
                  }).play();                  */
                  TweenLite.to(node, 1, {
                     konva: {
                        fontSize: size + 10
                     }                        
                  });
               }
            }

            var urlIndex = -1
            //if(!(url in listOfUrl)) {
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

               /*ball2 = new Konva.Circle({
                  x: x_tar,
                  y: y_tar,
                  radius: 5,
                  fill: ball.fill()
               });

               ballTween2 = new Konva.Tween({
                  node: ball2,
                  x: -10,
                  y: getRandomArbitrary(0, stage.getHeight()),
                  duration: getRandomArbitrary(0.1, 2),
                  onFinish: function() {
                     ball2.destroy();                              
                  }
               });

               ballLayer.add(ball);
               ballTween = new Konva.Tween({
                  node: ball,
                  x: x_tar,
                  y: y_tar + 5,
                  duration: getRandomArbitrary(0.1, 2),
                  onFinish: function() {
                     ball.destroy();
                     ballLayer.add(ball2);
                     ballTween2.play();
                  }
               })
               ballTween.play();                */  

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
                  })
                  /*.eventCallback('onComplete', function() {
                     
                  })*/
               
               y_counter2 = y_counter2 >= (20 * MAX_SIZE2) ? 0 : y_counter2 + 20;
               if(listOfUrl.length >= MAX_SIZE2) {                  
                  listOfUrl.shift();
                  var removeUrl = listOfUrlNodes.shift();
                  /*new Konva.Tween({
                     node: removeUrl,
                     x: stage.getWidth() + 100,
                     duration: 0.2,
                     onFinish: function() {
                        removeUrl.destroy();
                        layer.add(urlText)
                        new Konva.Tween({
                           node: urlText,
                           scale: 1,
                           duration: 0.2
                        }).play();
                     }
                  }).play();   */
                  
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