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

/* Begin Processing the specific Log File */
router.get('/log/:file', function(req, res, next) {
   filePath = logDirectory + '/' + req.params.file;
   
   // Tells the server to open the file and keep it in session
   lineReader.open(filePath, function(reader) {
      req.session.filePosition = reader.getFilePosition();
      req.session.filePath = filePath;
      console.log(reader.getFilePosition());
      var result = { status: 'ok' }
      res.json(result);
   }, 0, '\n', 'utf-8', 1024);
}); 

/* Begin Processing the specific Log File */
router.get('/next', function(req, res, next) {
   filePath = logDirectory + '/' + req.params.file;
   filePosition = req.session.filePosition;
   filePath = req.session.filePath;
   bufferStr = req.session.bufferStr;
   
   if(filePosition != undefined && filePath != undefined && filePosition > 0) {
      lineReader.open(filePath, function(reader) {
         if(reader.hasNextLine()) {
            reader.nextLine(function(line) {
               req.session.filePosition = reader.getFilePosition();
               req.session.bufferStr = reader.getBufferStr();
               res.send(line);
            });
         }
      }, filePosition, '\n', 'utf-8', 1024, bufferStr);      
   }
   
})

module.exports = router;
