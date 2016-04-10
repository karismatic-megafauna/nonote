#!/usr/bin/env node
'use strict';

var _sourceMapSupport = require('source-map-support');

require('babel-polyfill');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _coPrompt = require('co-prompt');

var _coPrompt2 = _interopRequireDefault(_coPrompt);

var _default = require('../templates/default.json');

var _default2 = _interopRequireDefault(_default);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _sourceMapSupport.install)();
// Libs


var emptyFunc = () => {};

function makeNote(jsonObj) {
  let cb = arguments.length <= 1 || arguments[1] === undefined ? emptyFunc : arguments[1];

  var dir = getDateDir();
  var toMd = `${ dir }/note.md`;
  var noteMd = _fsExtra2.default.createWriteStream(toMd);

  Object.keys(jsonObj).map(function (title) {
    var cliRef = jsonObj[title]['cli-ref'];
    noteMd.write(`# ${ title } --> ${ cliRef }\n`);
    Object.keys(jsonObj[title]['items']).map(function (items, index) {
      var status = jsonObj[title]['items'][items]['status'];
      var checkBox = '- [ ]';
      var itemIndex = ` ${ index }.) `;
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

function removeSection(section) {
  var dir = getDateDir();
  var toData = `${ dir }/data.json`;
  var dataJSON = _fsExtra2.default.readJsonSync(toData);

  Object.keys(dataJSON).map(note => {
    if (dataJSON[note]['cli-ref'] === section) {
      console.log(`"${ _chalk2.default.cyan(note) }" section was removed!`);
      delete dataJSON[note];
    }
  });

  _fsExtra2.default.writeJsonSync(toData, dataJSON);
  makeNote(dataJSON);
}

function createSection(name, cliRef) {
  let description = arguments.length <= 2 || arguments[2] === undefined ? 'no description' : arguments[2];

  var dir = getDateDir();
  var toData = `${ dir }/data.json`;
  var dataJSON = _fsExtra2.default.readJsonSync(toData);
  dataJSON[name] = {
    'cli-ref': cliRef,
    'description': description,
    'items': []
  };
  _fsExtra2.default.writeJsonSync(toData, dataJSON);
  makeNote(dataJSON, () => {
    process.exit();
  });

  // TODO: make makenote sycronus
}

function addNote(noteObj, key) {
  var dir = getDateDir();
  var toData = `${ dir }/data.json`;
  var dataJSON = _fsExtra2.default.readJsonSync(toData);
  var noteString = noteObj.reduce(function (memo, word) {
    return memo + ' ' + word;
  });

  var descriptionObj = {
    description: noteString,
    status: 'incomplete'
  };

  // modify toData
  Object.keys(dataJSON).map(function (note) {
    if (dataJSON[note]['cli-ref'] === key) {
      dataJSON[note]['items'].push(descriptionObj);
      _fsExtra2.default.writeJsonSync(toData, dataJSON);
    }
  });
  makeNote(dataJSON);
}

function changeStatus(index, key, cb) {
  var dir = getDateDir();
  var toData = `${ dir }/data.json`;
  var dataJSON = _fsExtra2.default.readJsonSync(toData);
  var cliFound = false;
  Object.keys(dataJSON).map(function (note, noteIndex) {
    if (dataJSON[note]['cli-ref'] === key) {
      cliFound = true;
      if (!dataJSON[note]['items'][index]) {
        throw new Error(`index ${ index } in "${ key }" object does not exist`);
      }
      cb(dataJSON[note]['items'], index);
      _fsExtra2.default.writeJsonSync(toData, dataJSON);
    } else if (Object.keys(dataJSON).length === noteIndex + 1 && !cliFound) {
      throw new Error(`"${ key }" <cli-ref> does not exist`);
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
  if (lastChar === "/") {
    userDir = userDir.slice(0, -1);
  }

  var doubleIndex = userDir.indexOf("//");
  if (doubleIndex > -1) {
    userDir = userDir.slice(0, doubleIndex) + userDir.slice(doubleIndex + 1);
  }

  var rcFile = `${ process.env.HOME }/.nonoterc.json`;
  _fsExtra2.default.closeSync(_fsExtra2.default.openSync(rcFile, 'w'));

  var dotFileJSON = {};
  dotFileJSON.notesDirectory = userDir;

  _fsExtra2.default.writeJsonSync(rcFile, dotFileJSON);
  console.log(_chalk2.default.green('Success!'));
  console.log(' ');
  console.log('dotfile `.nonoterc.json` created at $HOME');
  console.log(' ');
  console.log('Notes will be made in this directory: ');
  console.log(_chalk2.default.cyan(dotFileJSON.notesDirectory));
  console.log(' ');
}

function getRootDir() {
  var config = `${ process.env.HOME }/.nonoterc.json`;
  // TODO: handle the case of `nonote new` when `nonote init` has not been run
  return _fsExtra2.default.readJsonSync(config).notesDirectory;
}

function getDateDir(type) {
  var today = (0, _moment2.default)().format("DD-MM-YYYY");
  var notesDir = getRootDir();
  var days = `${ notesDir }/days/`;
  var toDir = days + today;
  return toDir;
}

function createDir(create, path) {
  var templateDest = path + '/templates/';
  var templateFile = path + '/templates/default.json';
  if (create) {
    _fsExtra2.default.mkdirsSync(path);
    _fsExtra2.default.mkdirsSync(templateDest);
    _fsExtra2.default.closeSync(_fsExtra2.default.openSync(templateFile, 'w'));
    _fsExtra2.default.writeJsonSync(templateFile, _default2.default);
    console.log(' ');
    console.log(_chalk2.default.green('Success!'));
  } else {
    console.log(' ');
    console.log('Make sure that dir exists and has a templates dir in it with a note config!');
  }
}

_commander2.default.version('0.0.1').command('new [template]').alias('n').description('create a new note for the day').action(function (template, cmd) {
  if (!template) {
    template = 'default';
  }
  var notePath = getDateDir();
  var noteJSON = `${ notePath }/data.json`;
  var rootDir = getRootDir();
  var templateData = `${ rootDir }/templates/${ template }.json`;

  console.log(`creating new note from the ${ _chalk2.default.cyan(template) } template!`);

  _fsExtra2.default.mkdirsSync(notePath);
  _fsExtra2.default.copySync(templateData, noteJSON);
  makeNote(_fsExtra2.default.readJsonSync(noteJSON));

  console.log(`\nnew note created for today: \n${ _chalk2.default.cyan(notePath) }`);
});

_commander2.default.command('watch').alias('w').description('watches todays note').action(function () {
  let notePath = getDateDir();
  let noteMd = `${ notePath }/note.md`;
  const cb = (err, stdout, stderr) => {
    console.log(`${ stdout }`);
  };

  (0, _child_process.exec)(`clear`, cb);
  (0, _child_process.exec)(`cat ${ noteMd }`, cb);

  _fsExtra2.default.watch(noteMd, () => {
    (0, _child_process.exec)(`clear`, cb);
    (0, _child_process.exec)(`cat ${ noteMd }`, cb);
  });
});

_commander2.default.command('section').alias('s').description('create new section').action(function () {
  (0, _co2.default)(function* () {
    var sectionName = yield (0, _coPrompt2.default)('New section name: ');
    var cliRefName = yield (0, _coPrompt2.default)('Cli reference key: ');
    var description = yield (0, _coPrompt2.default)('Short description: ');

    createSection(sectionName, cliRefName, description);

    console.log(_chalk2.default.green(`new section '${ sectionName }' was created!`));
  });
});

_commander2.default.command('init').description('initializes notes').action(function () {
  (0, _co2.default)(function* () {

    var notesDirPath = yield (0, _coPrompt2.default)('notes directory path (from $HOME): ');
    var homePath = `${ process.env.HOME }/${ notesDirPath }`;
    initializeNotes(homePath);

    var shouldCreate = yield _coPrompt2.default.confirm(`Would you like me to create "${ homePath }" for you?(Recommended) [y/N] `);
    createDir(shouldCreate, homePath);
    console.log('Start taking notes with', _chalk2.default.cyan('nonote new!'));
    // TODO: create a readme
    process.exit();
  });
});

_commander2.default.command('add <cli-ref> [notes...]').alias('a').description('add note to object').action(function (ref, note, cmd) {
  try {
    addNote(note, ref);
    console.log(_chalk2.default.green('note added!'));
  } catch (e) {
    console.log(_chalk2.default.red(e));
  }
});

_commander2.default.command('remove <cli-ref> [index]').alias('r').option('-s, --section', 'remove a seciton').description('remove note from note object').action(function (ref, note, options) {
  if (options.section && note === undefined) {
    removeSection(ref);
  } else {
    try {
      changeStatus(note, ref, removeNote);
      console.log(_chalk2.default.green(`note at index[${ note }] was removed!`));
    } catch (e) {
      console.log(_chalk2.default.red(e));
    }
  }
});

_commander2.default.command('complete <cli-ref> [index]').alias('c').description('mark item as complete').action(function (ref, note, cmd) {
  try {
    changeStatus(note, ref, completeNote);
    console.log(_chalk2.default.green(`note at index[${ note }] was marked as complete!`));
  } catch (e) {
    console.log(_chalk2.default.red(e));
  }
});

_commander2.default.command('incomplete <cli-ref> [index]').alias('i').description('mark item as incomplete').action(function (ref, note, cmd) {
  try {
    changeStatus(note, ref, incompleteNote);
    console.log(_chalk2.default.green(`note at index[${ note }] was marked as incomplete!`));
  } catch (e) {
    console.log(_chalk2.default.red(e));
  }
});

_commander2.default.command('failed [cli-ref] <index>').alias('f').description('mark item as failed').action(function (ref, note, cmd) {
  try {
    changeStatus(note, ref, failNote);
    console.log(_chalk2.default.green(`note at index[${ note }] was marked as failed :(`));
  } catch (e) {
    console.log(_chalk2.default.red(e));
  }
});

_commander2.default.parse(process.argv);
//# sourceMappingURL=main.js.map