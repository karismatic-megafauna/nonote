'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeNote = removeNote;
exports.completeNote = completeNote;
exports.incompleteNote = incompleteNote;
exports.failNote = failNote;
exports.createDir = createDir;
exports.getRootDir = getRootDir;
exports.getDateDir = getDateDir;
exports.initializeNotes = initializeNotes;
exports.changeStatus = changeStatus;
exports.makeNote = makeNote;
exports.removeSection = removeSection;
exports.createSection = createSection;
exports.addNote = addNote;

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _default = require('../templates/default.json');

var _default2 = _interopRequireDefault(_default);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

function createDir(path) {
  var templateDest = path + '/templates/';
  var templateFile = path + '/templates/default.json';
  _fsExtra2.default.mkdirsSync(path);
  _fsExtra2.default.mkdirsSync(templateDest);
  _fsExtra2.default.closeSync(_fsExtra2.default.openSync(templateFile, 'w'));
  _fsExtra2.default.writeJsonSync(templateFile, _default2.default);
  console.log(_chalk2.default.green('Success!'));
}

function getRootDir() {
  var config = `${process.env.HOME}/.nonoterc.json`;
  // TODO: handle the case of `nonote new` when `nonote init` has not been run
  return _fsExtra2.default.readJsonSync(config).notesDirectory;
}

function getDateDir() {
  const today = (0, _moment2.default)().format("DD-MM-YYYY");
  const notesDir = getRootDir();
  const days = `${notesDir}/days/`;
  const toDir = days + today;
  return toDir;
}

function initializeNotes(userDir) {
  var lastChar = userDir.substr(userDir.length - 1);
  if (lastChar === "/") {
    userDir = userDir.slice(0, -1);
  }

  var doubleIndex = userDir.indexOf("//");
  if (doubleIndex > -1) {
    userDir = userDir.slice(0, doubleIndex) + userDir.slice(doubleIndex + 1);
  }

  var rcFile = `${process.env.HOME}/.nonoterc.json`;
  _fsExtra2.default.closeSync(_fsExtra2.default.openSync(rcFile, 'w'));

  var dotFileJSON = {};
  dotFileJSON.notesDirectory = userDir;

  _fsExtra2.default.writeJsonSync(rcFile, dotFileJSON);
  console.log(`\ndotfile ".nonoterc.json" created at ${process.env.HOME}`);
  console.log(' ');
  console.log('Notes will be made in this directory: ');
  console.log(_chalk2.default.cyan(dotFileJSON.notesDirectory));
  console.log(' ');
}

function changeStatus(index, key, cb) {
  const today = (0, _moment2.default)().format("DD-MM-YYYY");
  var configPath = `${process.env.HOME}/.nonoterc.json`;
  _fsExtra2.default.readJson(configPath, (err, configJSON) => {
    if (err) console.error(err);

    const notesDir = configJSON.notesDirectory;
    const days = `${notesDir}/days/`;
    const toDir = days + today;
    var toData = `${toDir}/data.json`;

    _fsExtra2.default.readJson(toData, (err, dataJSON) => {
      if (err) console.error(err);

      var cliFound = false;
      dataJSON.forEach((note, noteIndex) => {
        if (note['cli-ref'] === key) {
          cliFound = true;
          if (!note.items[index]) {
            throw new Error(`index ${index} in "${key}" object does not exist`);
          }
          cb(note.items, index);
          _fsExtra2.default.writeJson(toData, dataJSON, err => {
            if (err) return console.error(err);

            makeNote(dataJSON, () => {
              process.exit();
            });
          });
        } else if (dataJSON.length === noteIndex + 1 && !cliFound) {
          throw new Error(`"${key}" <cli-ref> does not exist`);
        }
      });
    });
  });
}

var emptyFunc = () => {};

function makeNote(notesData) {
  let cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : emptyFunc;

  var dir = getDateDir();
  var toMd = `${dir}/note.md`;
  var noteMd = _fsExtra2.default.createWriteStream(toMd);

  notesData.forEach(section => {
    var cliRef = section['cli-ref'];
    noteMd.write(`# ${section.title} --> ${cliRef}\n`);
    section.items.forEach((item, index) => {
      var status = item.status;
      var checkBox = '- [ ]';
      var itemIndex = ` ${index}.) `;
      if (status === 'complete') {
        checkBox = '- [x]';
      } else if (status === 'failed') {
        checkBox = '- [-]';
      }
      noteMd.write(checkBox + itemIndex + item.description + "\n");
    });
    noteMd.write("\n");
  });
  noteMd.on('finish', cb);
  noteMd.end();
}

function removeSection(section) {
  const today = (0, _moment2.default)().format("DD-MM-YYYY");
  var configPath = `${process.env.HOME}/.nonoterc.json`;
  _fsExtra2.default.readJson(configPath, (err, configJSON) => {
    const notesDir = configJSON.notesDirectory;
    const days = `${notesDir}/days/`;
    const dir = days + today;
    var dataPath = `${dir}/data.json`;
    _fsExtra2.default.readJson(dataPath, (err, dataJSON) => {

      Object.keys(dataJSON).map(note => {
        if (dataJSON[note]['cli-ref'] === section) {
          console.log(`"${_chalk2.default.cyan(note)}" section was removed!`);
          delete dataJSON[note];
        }
      });

      _fsExtra2.default.writeJson(dataPath, dataJSON, err => {
        if (err) return console.error(err);

        makeNote(dataJSON);
      });
    });
  });
}

function createSection(name, cliRef) {
  let description = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'no description';

  const today = (0, _moment2.default)().format("DD-MM-YYYY");
  var configPath = `${process.env.HOME}/.nonoterc.json`;
  _fsExtra2.default.readJson(configPath, (err, configJSON) => {
    const notesDir = configJSON.notesDirectory;
    const days = `${notesDir}/days/`;
    const dir = days + today;
    var dataPath = `${dir}/data.json`;
    _fsExtra2.default.readJson(dataPath, (err, dataJSON) => {
      dataJSON[name] = {
        'cli-ref': cliRef,
        'description': description,
        'items': []
      };

      _fsExtra2.default.writeJson(dataPath, dataJSON, err => {
        if (err) return console.error(err);

        makeNote(dataJSON, () => {
          process.exit();
        });
      });
    });
  });
}

function addNote(noteObj, key) {
  const today = (0, _moment2.default)().format("DD-MM-YYYY");
  var configPath = `${process.env.HOME}/.nonoterc.json`;
  _fsExtra2.default.readJson(configPath, (err, configJSON) => {
    if (err) console.error(err);

    const notesDir = configJSON.notesDirectory;
    const days = `${notesDir}/days/`;
    const toDir = days + today;
    const dataPath = `${toDir}/data.json`;

    var noteString = noteObj.reduce(function (memo, word) {
      return memo + ' ' + word;
    });

    var descriptionObj = {
      description: noteString,
      status: 'incomplete'
    };

    _fsExtra2.default.readJson(dataPath, (err, dataJSON) => {
      dataJSON.forEach(note => {
        if (note['cli-ref'] === key) {
          note.items.push(descriptionObj);
          _fsExtra2.default.writeJson(dataPath, dataJSON, err => {
            if (err) return console.error(err);

            makeNote(dataJSON, () => {
              process.exit();
            });
          });
        }
      });
    });
  });
}
//# sourceMappingURL=utils.js.map