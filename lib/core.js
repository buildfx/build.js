var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var util = require('util');

var settings;
var settingsFile = 'buildjs.json';

require('./penumerable');

exports.version = '0.0.1';

exports.main = function() {
  var hasWatchCommandlineArg = hasCommandlineArg('watch');
  
  console.log('\nBuildJS \t\t\t version', exports.version);
  console.log('Copyright (c) 2012, Joubert Nel\n');

  loadSettings(hasWatchCommandlineArg);

  if (hasWatchCommandlineArg) {
    buildApp(watchForUpdates);
  } else {
    buildApp();
  }
}

function hasCommandlineArg(theArg) {
  theArg = '--' + theArg;
  return process.argv.filter(function(i) { return i === theArg; }).length > 0;
}

function watchForUpdates() {
  function watchingMessage() { console.log('\nWatching for updates...'); };
  watchingMessage();
  settings.src.forEach(function(d) {
    fs.watch(d, function(event, filename) {
      console.log();
      util.log('Changed: ' + d);
      buildApp(watchingMessage);
    });
  });
}

function buildApp(after) {
  console.log('\nBuilding app...');
  readSource(function(fileContents) {
    var buildDir = path.resolve(process.cwd(), settings.build_dir);
    var appFileDir = path.resolve(process.cwd(), path.dirname(settings.app_file));
    var intermediateFile = path.join(buildDir, '_app.js');
    ensureDir(buildDir);
    ensureDir(appFileDir);
    
    concatenateSource(fileContents, intermediateFile);
    compileJS(intermediateFile, settings.app_file, after)
  });
}


function readSource(after) {
  console.log('Reading source files...');

  settings.src.pmap(fs.readFile, function(err, data, filename) {
    return {'file': filename,
	    'data': data};
  }, after);

 }

function concatenateSource(fileContents, outfile) {
  var stream;  
  
  console.log('Concatenating source files...');
  stream = fs.createWriteStream(outfile);
  fileContents.forEach(function(src) {
    console.log('+', src.file);
    if (settings.rewrites) {
      settings.rewrites.forEach(function(rule) {
	var from = new RegExp(rule.from, 'gi');
	src.data = replaceInBuffer(src.data, from, rule.to);
      });	
    }
    stream.write(new Buffer('/** Source: ' + src.file + ' **/\n'));
    if (settings.wrap_in_anonymous === true) stream.write(new Buffer('(function() {\n'));
    stream.write(src.data);
    if (settings.wrap_in_anonymous === true) stream.write(new Buffer('})();'));
  });

  stream.end();  
}

function replaceInBuffer(buffer, from, to) {
  var text = buffer.toString();
  var newBuffer;
  text = text.replace(from, to);
  newBuffer = new Buffer(text);
  return newBuffer;
}



function loadSettings(hasWatchCommandlineArg) {
  var data;
  console.log('Loading settings from: ', settingsFile);

  try {
    fs.statSync(settingsFile);
  } catch (e) {
    console.error('Missing file: ', settingsFile);
    process.exit(1);
  } 
  
  data = fs.readFileSync(settingsFile, 'utf8');
  settings = JSON.parse(data);
  settings.app_file = settings.app_file || path.join(settings.build_dir, 'app.js');
  settings.wrap_in_anonymous = (settings.wrap_in_anonymous === undefined) ? true : settings.wrap_in_anonymous;
  settings.no_minify = ((settings.no_minify === undefined) && hasWatchCommandlineArg) ? true : settings.no_minify | false;
  

  printSettings(settings);
}

function printSettings(settings) {
  /* Display loaded settings */
  console.log('\nSETTINGS');

  /* src */
  console.log('src: ', settings.src);

  /* build_dir */
  console.log('build_dir: ', settings.build_dir);

  /* app_file */
  console.log('app_file: ', settings.app_file);

  /* wrap_in_anonymous */
  console.log('wrap_in_anonymous: ', settings.wrap_in_anonymous);

  /* no_minify */
  console.log('no_minify: ', settings.no_minify);

}

function ensureDir(dir) {
  var depth;
  var path;
  var parts = dir.split('/');
  var numberOfParts = parts.length;
  var makeSubpath = function(parts, depth) {
    return parts.slice(0, depth).reduce(function(a, i) {
      return a + '/' + i;
    });
  };
    
  for (depth=2; depth <= numberOfParts; depth++) {
    path = makeSubpath(parts, depth);
    try {
      fs.statSync(path);
    } catch(e) {
      fs.mkdirSync(makeSubpath(parts, depth));
    }
  }
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
