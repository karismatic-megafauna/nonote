#!/usr/bin/env node --harmony
/* eslint-disable */
// Libs
var chalk = require('chalk');
var program = require('commander');
var fs = require('fs-extra');
var moment = require('moment');
var co = require('co');
var prompt = require('co-prompt');

// Globals
var today = moment().format("DD-MM-YYYY");

// TODO: move to config
// TODO: create nonote init command
// Replate code/node-notes with path from config

function getConfig() {
  try {
    var config = process.env['HOME'] + '/.nonoterc.json';
    return fs.readJsonSync(config).notesDirectory;
  } catch (e) {
    return console.error( e + '\n No .nonoterc defined at the root, run `$ nonnote init` to obtain!');
  }
}

function initializeNotes(userDir) {
  // create .nonoterc
  var rcFile = process.env['HOME'] + '/.nonoterc.json';
  fs.closeSync(fs.openSync(rcFile, 'w'));

  var dotFileJSON = {}
  dotFileJSON.notesDirectory = userDir;

  fs.writeJsonSync(rcFile, dotFileJSON);

  return console.log(rcFile);
}

function getDir(type) {
  var notesDir = getConfig();
  var days = notesDir + '/days/';
  var toDir = days + today;
  return toDir;
}

// TODO: move these to a helper file
// Util Functions
function makeNote(jsonObj) {
  var dir = getDir();
  var toMd = dir + '/note.md';
  var noteMd = fs.createWriteStream(toMd);
  Object.keys(jsonObj).map(function(title) {
    noteMd.write("# " + title + "\n");
    Object.keys(jsonObj[title]['items']).map(function(items, index){
      var status = jsonObj[title]['items'][items]['status'];
      var checkBox = '- [ ]';
      var itemIndex = ' ' + index + '.) ';
      if (status === 'complete') {
        checkBox = '- [x]';
      } else if (status === 'failed') {
        checkBox = '- [-]';
      }
      noteMd.write(checkBox + itemIndex + jsonObj[title]['items'][items]['description'] + "\n");
    });
    noteMd.write("\n");
  });
}

function addNote(noteObj, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(toData);
  var noteString = noteObj.reduce(function(memo, word){
    return memo + ' ' + word;
  });

  var descriptionObj = {
    description: noteString,
    status: 'incomplete',
  };

  // modify toData
  Object.keys(dataJSON).map(function(note){
    if (dataJSON[note]['cli-ref'] === key) {
      dataJSON[note]['items'].push(descriptionObj);
      fs.writeJsonSync(toData, dataJSON);
    }
  });
  makeNote(dataJSON);
}

// TODO: think about changing these status functions to a single type
// signiture -> changeStatus(index, key, newStatus)
// would this be a case for currying? or some other functional tecq?

function removeNote(index, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(dir + '/data.json');
  var cliFound = false;
  Object.keys(dataJSON).map(function(note, noteIndex){
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error('index ' + index + ' in "' + key + '" object does not exist');
      }
      dataJSON[note]['items'].splice(index, 1);
      fs.writeJsonSync(toData, dataJSON);
    } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
      throw new Error('"' + key + '" <cli-ref> does not exist');
    }
  });
  makeNote(dataJSON);
}

function completeNote(index, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(toData);
  var cliFound = false;
  Object.keys(dataJSON).map(function(note, noteIndex) {
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error('index ' + index + ' in "' + key + '" object does not exist');
      }
      dataJSON[note]['items'][index]['status'] = 'complete';
      fs.writeJsonSync(toData, dataJSON);
    } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
      throw new Error('"' + key + '" <cli-ref> does not exist');
    }
  });
  makeNote(dataJSON);
}

function incompleteNote(index, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(toData);
  var cliFound = false;
  Object.keys(dataJSON).map(function(note, noteIndex) {
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error('index ' + index + ' in "' + key + '" object does not exist');
      }
      dataJSON[note]['items'][index]['status'] = 'incomplete';
      fs.writeJsonSync(toData, dataJSON);
    } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
      throw new Error('"' + key + '" <cli-ref> does not exist');
    }
  });
  makeNote(dataJSON);
}

function failNote(index, key) {
  var dir = getDir();
  var toData = dir + '/data.json';
  var dataJSON = fs.readJsonSync(toData);
  var cliFound = false;
  Object.keys(dataJSON).map(function(note, noteIndex) {
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error('index ' + index + ' in "' + key + '" object does not exist');
      }
      dataJSON[note]['items'][index]['status'] = 'failed';
      fs.writeJsonSync(toData, dataJSON);
      return makeNote(dataJSON);
    } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
      throw new Error('"' + key + '" <cli-ref> does not exist');
    }
  });
}

program
  .version('0.0.1')
  .command('new [template]')
  .alias('n')
  .description('create a new note for the day')
  .action(function(template, cmd) {
    var dir = getDir();
    var toData = dir + '/data.json';
    var dataJSON = fs.readJsonSync(toData);
    var configJSON = fs.readJsonSync(getConfig());
    // read template in
    // get object template of proper name
    // if can't find, get first in templates object
    // var template = Object.keys(configJSON).map(function(key){
    //   if (key === templateValue){
    //     return
    //   }
    // });

    console.log(chalk.cyan('creating new note for today!'));

    fs.mkdirsSync(dir);
    fs.copySync(template, toData);
    makeNote(dataJSON);

    console.log(chalk.white('new note created for: ') + chalk.bold.green(today));
  });

program
  .command('init')
  .description('initializes notes')
  .action(function(cmd) {
    cmdValue = cmd;
    co(function *() {
      var notesDirPath = yield prompt('notes directory path: ');
      initializeNotes(notesDirPath);
      console.log(chalk.green('Great choice! ' + chalk.red(notesDirPath) + ' is where new notes will be added :)'));
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
