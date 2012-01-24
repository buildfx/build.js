require('./ember-metal');
require('./ember-runtime');

exports.SettingsLoader = Em.Object.extend({
  buildFile: 'buildjs.json',

  load: function() {
    var buildFile = this.get('buildFile');
    
    try {
      fs.statSync(buildFile);
    } catch (e) {
      console.error('Missing file: ', buildFile);
      process.exit(1);
    }
  }

});
