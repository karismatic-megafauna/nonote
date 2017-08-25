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
import { exec } from 'child_process';

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
}

function removeSection(section) {
  var dir = getDateDir();
  var toData = `${dir}/data.json`;
  var dataJSON = fs.readJsonSync(toData);

  Object.keys(dataJSON).map(note => {
    if ( dataJSON[note]['cli-ref'] === section ) {
      console.log(`"${chalk.cyan(note)}" section was removed!`);
      delete dataJSON[note];
    }
  });

  fs.writeJsonSync(toData, dataJSON);
  makeNote(dataJSON);
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
}

function addNote(noteObj, key) {
  const today = moment().format("DD-MM-YYYY");
  var configPath = `${process.env.HOME}/.nonoterc.json`;
  fs.readJson(configPath, (err, configJSON) => {
    if (err) console.error(err)

    const notesDir = configJSON.notesDirectory;
    const days = `${notesDir}/days/`;
    const toDir = days + today;
    const dataPath = `${toDir}/data.json`;

    var noteString = noteObj.reduce(function(memo, word){
      return memo + ' ' + word;
    });

    var descriptionObj = {
      description: noteString,
      status: 'incomplete',
    };

    // modify toData
    fs.readJson(dataPath, (err, dataJSON) => {
      Object.keys(dataJSON).map(function(note){
        if (dataJSON[note]['cli-ref'] === key) {
          dataJSON[note]['items'].push(descriptionObj);
          fs.writeJson(dataPath, dataJSON, (err) => {
            if (err) return console.error(err)

            makeNote(dataJSON, () => {process.exit();});
          });
        }
      });
    });
  });
}

function changeStatus(index, key, cb) {
  const today = moment().format("DD-MM-YYYY");
  var configPath = `${process.env.HOME}/.nonoterc.json`;
  fs.readJson(configPath, (err, configJSON) => {
    if (err) console.error(err)

    const notesDir = configJSON.notesDirectory;
    const days = `${notesDir}/days/`;
    const toDir = days + today;
    var toData = `${toDir}/data.json`;

    fs.readJson(toData, (err, dataJSON) => {
      if (err) console.error(err)

      var cliFound = false;
      Object.keys(dataJSON).map(function(note, noteIndex){
        if (dataJSON[note]['cli-ref'] === key) {
          cliFound = true;
          if (!dataJSON[note]['items'][index]) {
            throw new Error(`index ${index} in "${key}" object does not exist`);
          }
          cb(dataJSON[note]['items'], index);
          fs.writeJson(toData, dataJSON, (err) => {
            if (err) return console.error(err)

            makeNote(dataJSON, () => {process.exit();});
          });
        } else if (Object.keys(dataJSON).length === (noteIndex + 1) && !cliFound) {
          throw new Error(`"${key}" <cli-ref> does not exist`);
        }
      });
    });
  });
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

function getDateDir() {
  const today = moment().format("DD-MM-YYYY");
  const notesDir = getRootDir();
  const days = `${notesDir}/days/`;
  const toDir = days + today;
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
    const notePath = getDateDir();
    const noteJSON = `${notePath}/data.json`;
    const rootDir = getRootDir();
    const templateData = `${rootDir}/templates/${template}.json`;

    console.log(`creating new note from the ${chalk.cyan(template)} template!`);

    fs.mkdirsSync(notePath);
    fs.copySync(templateData, noteJSON);
    makeNote(fs.readJsonSync(noteJSON));

    console.log(`\nnew note created for today: \n${chalk.cyan(notePath)}`);
  });


program
  .command('watch')
  .alias('w')
  .description('watches todays note')
  .action(function(){
    const today = moment().format("DD-MM-YYYY");
    var configPath = `${process.env.HOME}/.nonoterc.json`;
    fs.readJson(configPath, (err, configJSON) => {
      if (err) console.error(err)

      const notesDir = configJSON.notesDirectory;
      const days = `${notesDir}/days/`;
      const toDir = days + today;
      const noteMd = `${toDir}/note.md`;

      fs.readFile(noteMd, (err, data) => {
        if (err) throw err;
        console.log('\x1Bc');
        console.log(data.toString());
      });

      fs.watch(noteMd, () => {
        fs.readFile(noteMd, (err, data) => {
          if (err) throw err;
          console.log('\x1Bc');
          console.log(data.toString());
        });
      });
    });
  });


program
  .command('section')
  .alias('s')
  .description('create new section')
  .action( function() {
    co(function *() {
      const sectionName = yield prompt('New section name: ');
      const cliRefName = yield prompt('Cli reference key: ');
      const description = yield prompt('Short description: ');

      createSection(sectionName, cliRefName, description);

      console.log(chalk.green(`new section '${sectionName}' was created!`));
    })
  });

program
  .command('init')
  .description('initializes notes')
  .action(function() {
    co(function *() {

      const notesDirPath = yield prompt('notes directory path (from $HOME): ');
      const homePath = `${process.env.HOME}/${notesDirPath}`;
      initializeNotes(homePath);

      const shouldCreate = yield prompt.confirm(`Would you like me to create "${homePath}" for you?(Recommended) [y/N] `);
      createDir(shouldCreate, homePath);
      console.log('Start taking notes with', chalk.cyan('nonote new!'));
      // TODO: create a readme
      process.exit();
    })
  });

program
  .command('add <cli-ref> [notes...]')
  .alias('a')
  .description('add note to object')
  .action(function(ref, note) {
    try {
      addNote(note, ref);
      console.log(chalk.green('note added!'));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('remove <cli-ref> [index]')
  .alias('r')
  .option('-s, --section', 'remove a seciton')
  .description('remove note from note object')
  .action(function(ref, note, options) {
    if (options.section && note === undefined) {
      removeSection(ref);
    } else {
      try {
        changeStatus(note, ref, removeNote);
        console.log(chalk.green(`note at index[${note}] was removed!`));
      } catch (e) {
        console.log(chalk.red(e));
      }
    }
  });

program
  .command('complete <cli-ref> [index]')
  .alias('c')
  .description('mark item as complete')
  .action(function(ref, note) {
    try {
      changeStatus(note, ref, completeNote);
      console.log(chalk.green(`note at index[${note}] was marked as complete!`));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

program
  .command('incomplete <cli-ref> [index]')
  .alias('i')
  .description('mark item as incomplete')
  .action(function(ref, note) {
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
  .action(function(ref, note) {
    try {
      changeStatus(note, ref, failNote);
      console.log(chalk.green(`note at index[${note}] was marked as failed :(`));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

  program.parse(process.argv);

