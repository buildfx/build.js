var fs = require('fs');
  
var K = function() {};
var FileWatcher = function(toPath, fromFilePath) {
  var self;

  if (this instanceof FileWatcher) {
    self = this;
  } else {
    self= new K();
  }

  self._to = toPath;
  self._fromFile = fromFilePath;
  
  return self;
};

K.prototype = FileWatcher.prototype;

FileWatcher.prototype = {

  to: function(path) {
  },
  
  fromFile: function(filePath) {
    this._fromFile = filePath;
    return this;
  },

  connect: function() {
    var filePath = this._fromFile;
    var to = this._to;
    
    fs.watchFile(filePath, function() {
      var buf = fs.readFileSync(filePath);
//      SC.set(to, buf);
      console.log('will set...');
    });
    return this;
  },

  disconnect: function() {
    var filePath = this._fromFile;
    fs.unwatchFile(filePath);
  }
}

module.exports = FileWatcher;