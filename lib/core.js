var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');

var settings;
var settingsFile = 'buildjs.json';
var outfileSuffix = '.o';

exports.version = '0.0.1';

exports.main = function() {
  console.log('\nBuildJS \t\t\t version', exports.version);
  console.log('Copyright (c) 2012, Joubert Nel\n');
  
  try {
    fs.statSync(settingsFile);
  } catch (e) {
    console.error('Missing file: ', settingsFile);
    process.exit(1);
  }

  loadSettings();
  buildApp(settings.src);
}

function buildApp(sourceDirs) {
  var remainingWork = sourceDirs.length;
  var compiledFiles = [];

  console.log('\nBuilding app...');

  sourceDirs.forEach(function(d) {
    var dirBuildPath = path.join(settings.build_dir, d);
    var dirOutfile = path.join(settings.build_dir, d + '.js' + outfileSuffix);

    compiledFiles.push(dirOutfile);

    buildSourceDir(d, dirBuildPath, function(compiledFiles) {
      linkSourceDirFiles(d, compiledFiles, dirOutfile, function() {
	remainingWork = remainingWork - 1;
	if (remainingWork === 0) {
	  linkAppFiles(compiledFiles);
	}
      });
    });

  });
}


function loadSettings() {
  console.log('Loading settings from: ', settingsFile);
  var data = fs.readFileSync(settingsFile, 'utf8');
  settings = JSON.parse(data);
  settings.app_file = settings.app_file || path.join(settings.build_dir, 'app.js');
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

function isJavascriptFile(filename) {
  return filename.substr(-3) === '.js';
}

function getJavascriptFilenames(dir) {
  var files = fs.readdirSync(dir);
  return files.filter(isJavascriptFile);
}


function buildSourceDir(dir, outdir, after) {
  var files = getJavascriptFilenames(dir);
  var compiledFiles = [];
  var remainingWork = files.length;
  ensureDir(outdir);
  
  files.forEach(function(f) {
    var inFile = path.join(dir, f);
    var outFile = path.join(outdir, f + outfileSuffix);
    compiledFiles.push(outFile);
    
    compileJS(inFile, outFile, function() {
      remainingWork = remainingWork - 1;
      if ((remainingWork === 0) && after) after(compiledFiles);
    });
  });
}

function linkFiles(compiledFiles, outfile, after) {
  console.log('Linking into: ', outfile);
  var inputFiles = compiledFiles.reduce(function(a, i) {
    return a + ' ' + i;
  });
  var command = 'cat ' + inputFiles + ' > ' + outfile;
  exec(command, function(err, stdout, stderr) {
    if (err) {
      console.error(err);
    } else {
      console.log('Written: ', outfile);
    }
    if (after) after();
  });  
}

function linkSourceDirFiles(dir, compiledFiles, outfile, after) {
  console.log('\nLinking files in directory: ', dir);
  linkFiles(compiledFiles, outfile, after);
}

function linkAppFiles(compiledFiles) {
  console.log('\nLinking app...');
  linkFiles(compiledFiles, settings.app_file);
}

function compileJS(inFile, outFile, after) {
  var buildjsScriptPath = process.argv[1];
  var buildjsDir = path.dirname(buildjsScriptPath);
  var command = 'java -jar ' + buildjsDir + '/compiler.jar --js ' + inFile + ' --js_output_file ' + outFile;
  
  console.log('\n');
  console.log(' in: ', inFile);
  console.log('out: ', outFile);
  console.log('-->  ', command);
  
  exec(command, function(err, stdout, stderr) {
    if (err) console.error(err);
    if (after) after();
  });
}



