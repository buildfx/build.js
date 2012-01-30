var SettingsLoaderModule = require('../lib/settings-loader');

describe('buildjs', function() {

  describe('settings loader', function() {

    
    it('defaults to "buildjs.json"', function() {
      var settingsLoader = SettingsLoaderModule.SettingsLoader.create();      
      expect(settingsLoader.get('buildFile')).toEqual('buildjs.json');
    });

    it('errors when tries to load "buildFile" that does not exist', function() {
      var settingsLoader = SettingsLoaderModule.SettingsLoader.create({
	buildFile: 'non_existing_file.txt'
      });

      settingsLoader.load();

    });

    
  });

});