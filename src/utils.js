import fs from 'fs-extra';
import moment from 'moment';
import chalk from 'chalk';
import templateJSON from '../templates/default.json';

export function removeNote(arry, index) {
  arry.splice(index, 1);
}

export function completeNote(arry, index) {
  arry[index]['status'] = 'complete';
}

export function incompleteNote(arry, index) {
  arry[index]['status'] = 'incomplete';
}

export function failNote(arry, index) {
  arry[index]['status'] = 'failed';
}

export function createDir(path) {
  var templateDest = path + '/templates/';
  var templateFile = path + '/templates/default.json';
  fs.mkdirsSync(path);
  fs.mkdirsSync(templateDest);
  fs.closeSync(fs.openSync(templateFile, 'w'));
  fs.writeJsonSync(templateFile, templateJSON);
  console.log(chalk.green('Success!'));
}

export function getRootDir() {
  var config = `${process.env.HOME}/.nonoterc.json`;
  // TODO: handle the case of `nonote new` when `nonote init` has not been run
  return fs.readJsonSync(config).notesDirectory;
}

export function getDateDir() {
  const today = moment().format("DD-MM-YYYY");
  const notesDir = getRootDir();
  const days = `${notesDir}/days/`;
  const toDir = days + today;
  return toDir;
}

export function initializeNotes(userDir) {
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
  console.log(`\ndotfile ".nonoterc.json" created at ${process.env.HOME}` );
  console.log(' ');
  console.log('Notes will be made in this directory: ')
  console.log(chalk.cyan(dotFileJSON.notesDirectory));
  console.log(' ');
}

export function changeStatus(index, key, cb) {
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

var emptyFunc = () => {};

export function makeNote(jsonObj, cb = emptyFunc) {
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

export function removeSection(section) {
  const today = moment().format("DD-MM-YYYY");
  var configPath = `${process.env.HOME}/.nonoterc.json`;
  fs.readJson(configPath, (err, configJSON) => {
    const notesDir = configJSON.notesDirectory;
    const days = `${notesDir}/days/`;
    const dir = days + today;
    var dataPath = `${dir}/data.json`;
    fs.readJson(dataPath, (err, dataJSON) => {

      Object.keys(dataJSON).map(note => {
        if ( dataJSON[note]['cli-ref'] === section ) {
          console.log(`"${chalk.cyan(note)}" section was removed!`);
          delete dataJSON[note];
        }
      });

      fs.writeJson(dataPath, dataJSON, (err) => {
        if (err) return console.error(err)

        makeNote(dataJSON);
      })
    });
  });
}

export function createSection(name, cliRef, description = 'no description') {
  const today = moment().format("DD-MM-YYYY");
  var configPath = `${process.env.HOME}/.nonoterc.json`;
  fs.readJson(configPath, (err, configJSON) => {
    const notesDir = configJSON.notesDirectory;
    const days = `${notesDir}/days/`;
    const dir = days + today;
    var dataPath = `${dir}/data.json`;
    fs.readJson(dataPath, (err, dataJSON) => {
      dataJSON[name] = {
        'cli-ref': cliRef,
        'description': description,
        'items': []
      };

      fs.writeJson(dataPath, dataJSON, (err) => {
        if (err) return console.error(err)

        makeNote(dataJSON, () => {process.exit();});
      })
    });
  });
}

export function addNote(noteObj, key) {
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
