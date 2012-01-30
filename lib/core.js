var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var util = require('util');
var buildfx = require('../build.fx/core');

var settings;
var settingsFile = 'buildjs.json';


function applyDefaultSettings(settings) {
  settings.app_file = settings.app_file || path.join(settings.build_dir, 'app.js');
  settings.wrap_in_anonymous = (settings.wrap_in_anonymous === undefined) ? true : settings.wrap_in_anonymous;
  settings.no_minify = ((settings.no_minify === undefined) && hasWatchCommandlineArg) ? true : settings.no_minify | false;
  return settings;
}

exports.version = '0.0.1';

exports.main = function() {
  var hasWatchCommandlineArg = buildfx.hasCommandlineArg('watch');
  
  console.log('\nBuildJS \t\t\t version', exports.version);
  console.log('Copyright (c) 2012, Joubert Nel\n');

  settings = applyDefaultSettings(buildfx.loadSettings(settingsFile, hasWatchCommandlineArg));
  printSettings(settings);

  if (hasWatchCommandlineArg) {
    buildApp(function() {
      buildfx.watchForUpdates(settings.src, buildApp);
    });
  } else {
    buildApp();
  }
}


function buildApp(after) {
  console.log('\nBuilding app...');
  buildfx.readSource(settings.src, function(sources) {
    var buildDir = path.resolve(process.cwd(), settings.build_dir);
    var appFileDir = path.resolve(process.cwd(), path.dirname(settings.app_file));
    var intermediateFile = path.join(buildDir, '_app.js');
    var wrapPattern = settings.wrap_in_anonymous ? '\n/** Source: %@ **/ \n (function() {\n%@})();' : '\n/** Source: %@ **/\n%@';
    var transform = settings.rewrites ? function(text) { return applyRewrites(text, rewrites); } : null;    

    buildfx.concatenateToFile(sources, intermediateFile, wrapPattern, transform);
    compileJS(intermediateFile, settings.app_file, after);
  });
}

function applyRewrites(text, rewrites) {
  rewrites.forEach(function(rule) {
    var from = new RegExp(rule.from, 'gi');
    text.replace(from, rule.to);
  });
  return text;
}



function printSettings(settings) {
  var acceptedSettings = ['src', 'rewrites', 'build_dir', 'app_file', 'wrap_in_anonymous', 'no_minify'];
  
  /* Display loaded settings */
  console.log('\nSETTINGS');

  acceptedSettings.forEach(function(s) {
    console.log(s + ': ', settings[s]);
  });
}



function compileJS(inFile, outFile, after) {
  var buildjsScriptPath = process.argv[1];
  var buildjsDir = path.dirname(buildjsScriptPath);
  var justCopy = 'cp ' + inFile + ' ' + outFile;
  var gcc = 'java -jar ' + buildjsDir + '/compiler.jar --js ' + inFile + ' --js_output_file ' + outFile;

  var command = settings.no_minify ? justCopy : gcc;
  
  console.log('Compiling JavaScript...');
  console.log('> ', command);
  
  exec(command, function(err, stdout, stderr) {
    if (err) console.error(err);
    if (after) after();
  });
}
