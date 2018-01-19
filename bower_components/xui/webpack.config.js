var fs = require('fs');
var emitterPath = '../../node_modules/wolfy87-eventemitter/EventEmitter.js';

function checkFileSync(directory) {  
  try {
    fs.statSync(directory);
    return directory;
  } catch(e) {
    return './node_modules/wolfy87-eventemitter/EventEmitter.js';
  }
}

emitterPath = checkFileSync(emitterPath);

module.exports = {
    entry: emitterPath,
    output: {
        path: __dirname,
        library: "EventEmitter",        
        filename: "XUI-Source-EventEmitter.js"
    }
};
