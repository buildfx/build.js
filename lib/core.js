var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var util = require('util');

var settings;
var settingsFile = 'buildjs.json';
var outfileSuffix = '.o';

exports.version = '0.0.1';

exports.main = function() {
  console.log('\nBuildJS \t\t\t version', exports.version);
  console.log('Copyright (c) 2012, Joubert Nel\n');

  loadSettings();
  
  if (process.argv.filter(function(i) { return i === '--watch'; }).length > 0) {
    buildApp(watchForUpdates);
  } else {
    buildApp();
  }
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
  var remainingWork;
  var fileContents;

  console.log('Reading source files...');
  remainingWork = settings.src.length;
  fileContents = new Array(remainingWork);

  settings.src.forEach(function(f, index) {
    fs.readFile(f, function(err, data) {
      fileContents[index] = {'file': f,
			     'data': data};
      remainingWork = remainingWork - 1;
      if ((remainingWork === 0) && after) after(fileContents);
    });
  });
}

function concatenateSource(fileContents, outfile) {
  var remainingWork = fileContents.length;
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


function loadSettings() {
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
  var command = 'java -jar ' + buildjsDir + '/compiler.jar --js ' + inFile + ' --js_output_file ' + outFile;
  
  console.log('Compiling JavaScript...');
  console.log('> ', command);
  
  exec(command, function(err, stdout, stderr) {
    if (err) console.error(err);
    if (after) after();
  });
}



