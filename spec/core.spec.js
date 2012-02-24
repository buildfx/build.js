var wrench = require('wrench');

describe('core', function() {

  describe('applyDefaultSettings', function() {
  });

  describe('applyRewrites', function() {
  });

  describe('buildApp', function() {
  });

  describe('compileJS', function() {
    var failSilently = function() {};
    
    beforeEach(function() {
      // Ensure there is no "temp" directory
      wrench.rmdirSyncRecursive('spec/temp', failSilently);
    });

    it('can copy inFile to outFile', function() {
            
    });
  });

});
