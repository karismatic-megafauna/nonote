#!/usr/bin/env node

import { install } from 'source-map-support';
install();

import 'babel-polyfill';
// Libs
import chalk from 'chalk';
import program from 'commander';
import fs from 'fs-extra';
import moment from 'moment';
import co from 'co';
import prompt from 'co-prompt';
import templateJSON from '../templates/default.json';

var emptyFunc = () => {};

function makeNote(jsonObj, cb = emptyFunc) {
  var dir = getDateDir();
  var toMd = `${dir}/note.md`;
  var noteMd = fs.createWriteStream(toMd);

  Object.keys(jsonObj).map(function(title) {
    var cliRef = jsonObj[title]['cli-ref'];
    noteMd.write(`# ${title} --> ${cliRef}\n`);
    Object.keys(jsonObj[title]['items']).map(function(items, index){
      var status = jsonObj[title]['items'][items]['status'];
      var checkBox = '- [ ]';
      var itemIndex = ` ${index}.) `;
      if (status === 'complete') {
        checkBox = '- [x]';
      } else if (status === 'failed') {
        checkBox = '- [-]';
      }
      noteMd.write(checkBox + itemIndex + jsonObj[title]['items'][items]['description'] + "\n");
    });
    noteMd.write("\n");
  });
  noteMd.on('finish', cb);
  noteMd.end();
  // console.log(`note for ${dir} modified!`);
}

function createSection(name, cliRef, description = 'no description') {
  var dir = getDateDir();
  var toData = `${dir}/data.json`;
  var dataJSON = fs.readJsonSync(toData);
  dataJSON[name] = {
    'cli-ref': cliRef,
    'description': description,
    'items': []
  };
  fs.writeJsonSync(toData, dataJSON);
  makeNote(dataJSON, () => {process.exit();});

  // TODO: make makenote sycronus
}

function addNote(noteObj, key) {
  var dir = getDateDir();
  var toData = `${dir}/data.json`;
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

function changeStatus(index, key, cb) {
  var dir = getDateDir();
  var toData = `${dir}/data.json`;
  var dataJSON = fs.readJsonSync(toData);
  var cliFound = false;
  Object.keys(dataJSON).map(function(note, noteIndex){
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error(`index ${index} in "${key}" object does not exist`);
      }
      cb(dataJSON[note]['items'], index);
      fs.writeJsonSync(toData, dataJSON);
    } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
      throw new Error(`"${key}" <cli-ref> does not exist`);
    }
  });
  makeNote(dataJSON);
}

function removeNote(arry, index) {
  arry.splice(index, 1);
}

function completeNote(arry, index) {
  arry[index]['status'] = 'complete';
}

function incompleteNote(arry, index) {
  arry[index]['status'] = 'incomplete';
}

function failNote(arry, index) {
  arry[index]['status'] = 'failed';
}

function initializeNotes(userDir) {
  var lastChar = userDir.substr(userDir.length - 1);
  if ( lastChar === "/" ) {
    userDir = userDir.slice(0, -1);
  }

  var doubleIndex = userDir.indexOf("//");
  if ( doubleIndex > -1 ) {
    userDir = userDir.slice(0, doubleIndex) + userDir.slice(doubleIndex + 1);
  }

  var rcFile = `${process.env.HOME}/.nonoterc.json`;
  fs.closeSync(fs.openSync(rcFile, 'w'));

  var dotFileJSON = {}
  dotFileJSON.notesDirectory = userDir;

  fs.writeJsonSync(rcFile, dotFileJSON);
  console.log(chalk.green('Success!'));
  console.log(' ');
  console.log('dotfile `.nonoterc.json` created at $HOME' );
  console.log(' ');
  console.log('Notes will be made in this directory: ')
  console.log(chalk.cyan(dotFileJSON.notesDirectory));
  console.log(' ');
}

function getRootDir() {
  var config = `${process.env.HOME}/.nonoterc.json`;
  // TODO: handle the case of `nonote new` when `nonote init` has not been run
  return fs.readJsonSync(config).notesDirectory;
}

function getDateDir(type) {
  var today = moment().format("DD-MM-YYYY");
  var notesDir = getRootDir();
  var days = `${notesDir}/days/`;
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
    if(!template) {
      template = 'default';
    }
    var notePath = getDateDir();
    var noteJSON = `${notePath}/data.json`;
    var rootDir = getRootDir();
    var templateData = `${rootDir}/templates/${template}.json`;
    console.log(notePath, noteJSON, rootDir, templateData);

    console.log(chalk.cyan(`creating new note from the ${template} template!`));

    fs.mkdirsSync(notePath);
    fs.copySync(templateData, noteJSON);
    makeNote(fs.readJsonSync(noteJSON));

    console.log(chalk.white('new note created'));
  });


program
  .command('section')
  .alias('s')
  .description('create new section')
  .action( function() {
    co(function *() {
      var sectionName = yield prompt('New section name: ');
      var cliRefName = yield prompt('Cli reference key: ');
      var description = yield prompt('Short description: ');

      createSection(sectionName, cliRefName, description);

      console.log(chalk.green(`new section '${sectionName}' was created!`));
    })
  });

program
  .command('init')
  .description('initializes notes')
  .action(function() {
    co(function *() {

      var notesDirPath = yield prompt('notes directory path (from $HOME): ');
      var homePath = `${process.env.HOME}/${notesDirPath}`;
      initializeNotes(homePath);

      var shouldCreate = yield prompt.confirm(`Would you like me to create "${homePath}" for you?(Recommended) [y/N] `);
      createDir(shouldCreate, homePath);
      console.log('Start taking notes with', chalk.cyan('nonote new!'));
      // TODO: create a readme
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
      changeStatus(note, ref, removeNote);
      console.log(chalk.green(`note at index[${note}] was removed!`));
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
      changeStatus(note, ref, completeNote);
      console.log(chalk.green(`note at index[${note}] was marked as complete!`));
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
      changeStatus(note, ref, incompleteNote);
      console.log(chalk.green(`note at index[${note}] was marked as incomplete!`));
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
      changeStatus(note, ref, failNote);
      console.log(chalk.green(`note at index[${note}] was marked as failed :(`));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

  program.parse(process.argv);

