#!/usr/bin/env node --harmony
/* eslint-disable */
// Libs
var chalk = require('chalk');
var program = require('commander');
var fs = require('fs-extra');
var moment = require('moment');
var co = require('co');
var prompt = require('co-prompt');
// var getConfig = require('./utils').getConfig;
// var createDir = require('./utils').createDir;
// var initializeNotes = require('./utils').initializeNotes;
// var getDir = require('./utils').getDir;
var makeNote = require('./utils').makeNote;
var addNote = require('./utils').addNote;
var removeNote = require('./utils').removeNote;
var completeNote = require('./utils').completeNote;
var incompleteNote = require('./utils').incompleteNote;
var templateJSON = require('./templates/default.json');

function initializeNotes(userDir) {
  console.log(chalk.green('Success!'));
  var rcFile = process.env['HOME'] + '/.nonoterc.json';
  fs.closeSync(fs.openSync(rcFile, 'w'));

  var dotFileJSON = {}
  dotFileJSON.notesDirectory = userDir;

  fs.writeJsonSync(rcFile, dotFileJSON);
  console.log(' ');
  console.log(chalk.green('Success!'));
  console.log(' ');
  console.log('dotfile `.nonoterc.json` created at $HOME' );
  console.log(' ');
  console.log('Notes will be made in this directory: ')
  console.log(chalk.cyan(dotFileJSON.notesDirectory));
  console.log(' ');
}
function getConfig() {
  var config = process.env['HOME'] + '/.nonoterc.json';
  // TODO: handle the case of `nonote new` when `nonote init` has not been run
  return fs.readJsonSync(config).notesDirectory;
}

function getDir(type) {
  var today = moment().format("DD-MM-YYYY");
  var notesDir = getConfig();
  var days = notesDir + '/days/';
  var toDir = days + today;
  return toDir;
}

function createDir(create, path) {
  var templateDest = path + '/templates/';
  var templateFile = path + '/templates/default.json';
  if (create) {
    fs.mkdirsSync(path);
    fs.mkdirsSync(templateDest);
    fs.closeSync(fs.openSync(templateFile, 'w'));
    fs.writeJsonSync(templateFile, templateJSON);
    console.log(' ');
    console.log(chalk.green('Success!'));
  } else {
    console.log(' ');
    console.log('Make sure that dir exists and has a templates dir in it with a note config!');
  }
}


program
  .version('0.0.1')
  .command('new [template]')
  .alias('n')
  .description('create a new note for the day')
  .action(function(template, cmd) {
    // var today = moment().format("DD-MM-YYYY");
    // var dir = getConfig();
    // var toData = dir + '/data.json';
    // var dataJSON = fs.readJsonSync(toData);
    // var configJSON = fs.readJsonSync(getConfig());
    // // read template in
    // // get object template of proper name
    // // if can't find use default

    // var createTemplate = template || '/default.json'

    // console.log(chalk.cyan('creating new note for today!'));

    // fs.mkdirsSync(dir);
    // fs.copySync(template, toData);
    // makeNote(dataJSON);

    // console.log(chalk.white('new note created for: ') + chalk.bold.green(today));
  });

program
  .command('init')
  .description('initializes notes')
  .action(function(cmd) {
    cmdValue = cmd;
    co(function *() {

      var notesDirPath = yield prompt('notes directory path (from $HOME): ');
      var homePath = process.env['HOME'] + '/' + notesDirPath;
      initializeNotes(homePath);

      var shouldCreate = yield prompt.confirm('Would you like me to create "' + homePath + '" for you?(Recommended) [y/N] ');
      createDir(shouldCreate, homePath);
      console.log('Start taking notes with ' + chalk.cyan('nonote new!'));
      process.exit();
    })
  });

program
  .command('add [cli-ref] <notes...>')
  .alias('a')
  .description('add note to object')
  .action(function(ref, note, cmd) {
    try {
      addNote(note, ref);
      console.log(chalk.green('note added!'));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('remove [cli-ref] <index>')
  .alias('r')
  .description('remove note from note object')
  .action(function(ref, note, cmd) {
    try {
      removeNote(note, ref);
      console.log(chalk.green('note at index[' + note + '] was removed!'));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('complete [cli-ref] <index>')
  .alias('c')
  .description('mark item as complete')
  .action(function(ref, note, cmd) {
    try {
      completeNote(note, ref);
      console.log(chalk.green('note at index[' + note + '] was marked as complete!'));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('incomplete [cli-ref] <index>')
  .alias('i')
  .description('mark item as incomplete')
  .action(function(ref, note, cmd) {
    try {
      incompleteNote(note, ref);
      console.log(chalk.green('note at index[' + note + '] was marked as incomplete!'));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('failed [cli-ref] <index>')
  .alias('f')
  .description('mark item as failed')
  .action(function(ref, note, cmd) {
    try {
      failNote(note, ref);
      console.log(chalk.green('note at index[' + note + '] was marked as failed :('));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

  program.parse(process.argv);

  /* eslint-enable*/
