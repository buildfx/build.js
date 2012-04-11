// These specs can be run with jasmine-node


var buildjs = require('../lib/core.js');


describe('core', function() {

  describe('getDependencies(fileName, dependencyRegex)', function() {
    it('returns the filenames that follow "// @depend "', function() {
      var rootFile = 'spec/data/main.js';
      var dependencies = buildjs.getDependencies(rootFile);
      expect(dependencies).toEqual(['stateManager.js', 'controller/treeViewController.js']);
    });

    it('can return filenames that follow any arbitrary regex dependency matcher', function() {
      var dependencyRegex = /\/\/\s*@include\s*([\S]*)/g;
      var rootFile = 'spec/data/main.js';
      var dependencies = buildjs.getDependencies(rootFile, dependencyRegex);
      expect(dependencies).toEqual(['anotherStateManager.js', 'controller/anotherViewController.js']);
    });
  });

  describe('getDependencyGraph(fileName, dependencyRegex)', function() {
    it('returns a graph of files that the file called "filename" depends on', function() {
      
    });
  });

});
