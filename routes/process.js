var express = require('express');
var S = require('string');
var lineReader = require('line-reader');
var fs = require('fs');
var appRoot = require('app-root-path');
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
router.get('/next', function(req, res, next) {
   filePath = logDirectory + '/' + req.params.file;
   filePosition = req.session.filePosition;
   filePath = req.session.filePath;
   bufferStr = req.session.bufferStr;
   
   var pattern = /^([0-9.]+)\s([w.-]+)\s([w.-]+)\s\[(.+)\]\s"((?:[^"]|")+?)"\s(\d{3})\s(\d+|(.+?))\s"([^"]+|(.+?))"\s"([^"]+|(.+?))"$/
   
   if(filePosition != undefined && filePath != undefined && filePosition > 0) {
      lineReader.open(filePath, function(reader) {
         if(reader.hasNextLine()) {
            reader.nextLine(function(line) {
               req.session.filePosition = reader.getFilePosition();
               req.session.bufferStr = reader.getBufferStr();
               
               var result = pattern.exec(line);
               
               var reply = {
                  'status': true,
                  'ip': result[1],
                  'date': result[4].replace(':', ' ', 1),
                  'request': result[5],
                  'status': result[6],
                  'agent': result[11] 
               }
               res.json(reply);
            });
         }
      }, filePosition, '\n', 'utf-8', 1024, bufferStr);      
   } else {
      res.json({ status: false });
   }   
})

module.exports = router;
