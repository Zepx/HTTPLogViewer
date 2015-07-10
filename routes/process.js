var express = require('express');
var S = require('string');
var lineReader = require('line-reader');
var fs = require('fs');
var appRoot = require('app-root-path');
var async = require('async');
var router = express.Router();

var logDirectory = appRoot + '/logs/';

/* Returns the list of Log Files available */
router.get('/filelist', function(req, res, next) {
    
   //Obtain Log Files from the Log Directory
   fs.readdir(logDirectory, function(err, files) {
      res.json(files);
   })
});

/* Starts Reading Log File. Does not output the result though. Subsequent call should be done on /process/next */
router.get('/log/:file', function(req, res, next) {
   filePath = logDirectory + '/' + req.params.file;
   
   // Tells the server to open the file and keep it in session
   lineReader.open(filePath, function(reader) {
      req.session.filePosition = reader.getFilePosition();
      req.session.filePath = filePath;
      req.session.bufferStr = reader.getBufferStr();
      console.log(reader.getFilePosition());
      var result = { status: true }
      res.json(result);
   }, 0, '\n', 'utf-8', 1024);
}); 

/* Returns the subsequent line in the log file. */
router.get('/next/:number', function(req, res, next) {
   filePath = logDirectory + '/' + req.params.file;
   numberOfLines = req.params.number || 1;
   filePosition = req.session.filePosition;
   filePath = req.session.filePath;
   bufferStr = req.session.bufferStr;
   
   var n = parseInt(numberOfLines);
   var pattern = /^([0-9.]+)\s([w.-]+)\s([w.-]+)\s\[(.+)\]\s"((?:[^"]|")+?)"\s(\d{3})\s(\d+|(.+?))\s"([^"]+|(.+?))"\s"([^"]*|(.+?))"$/
   
   if(filePosition != undefined && filePath != undefined && filePosition > 0) {
      lineReader.open(filePath, function(reader) {
         var outputBuffer = [];
         var testLine = '';
         var counter = 0;
         var flag = 0;
         
         async.whilst(
            function() { return counter++ < n },
            function(callback) {
               if(reader.hasNextLine()) {
                  reader.nextLine(function(line) {
//                     console.log(counter);
                     req.session.filePosition = reader.getFilePosition();
                     req.session.bufferStr = reader.getBufferStr();

                     var result = pattern.exec(line);
                     
                     if(result != null && result.length < 11) callback();
                     //console.log(result);
                     
                     try {
                        var reply = {
                           'status': true,
                           'ip': result[1],
                           'date': result[4].replace(':', ' ', 1),
                           'request': result[5].replace(/(GET|POST|HEAD)/, '').replace(/\sHTTP\/1\.[0-1]/, '').trim(),
                           'statusCode': result[6],
                           'agent': result[11] 
                        }   
                     } catch(err) {
                        console.log("Line Error: " + line);
                        console.log(err);
                        counter = n;
                     }
                     
                     outputBuffer.push(reply);                     
                     callback();
                  });
               } else {
                  flag = 1;
                  callback();
               }
            },
            function(err) {
               reader.close();
               if(flag === 1)
                  res.json([{status: false}]);
               else
                  res.json(outputBuffer);
            }
         );
         
      }, filePosition, '\n', 'utf-8', 1024, bufferStr);      
   } else {
      res.json({ status: false });
   }   
})

module.exports = router;
