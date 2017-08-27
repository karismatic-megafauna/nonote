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

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _sourceMapSupport.install)();
// Libs


_commander2.default.version('0.0.1').command('new [template]').alias('n').description('create a new note for the day').action(function (template, cmd) {
  if (!template) {
    template = 'default';
  }
  const today = (0, _moment2.default)().format("DD-MM-YYYY");
  const yesterday = (0, _moment2.default)().subtract(1, 'day').format("DD-MM-YYYY");
  var configPath = `${ process.env.HOME }/.nonoterc.json`;

  _fsExtra2.default.readJson(configPath, (err, configObj) => {
    if (err) console.error(err);

    const notesDir = configObj.notesDirectory;
    const days = `${ notesDir }/days/`;
    const todayPath = days + today;
    const yesterdayPath = days + yesterday;
    const yesterdayDataJSONPath = `${ yesterdayPath }/data.json`;
    const dataJSONPath = `${ todayPath }/data.json`;
    const noteMdPath = `${ todayPath }/note.md`;

    const templateDataPath = `${ notesDir }/templates/${ template }.json`;

    _fsExtra2.default.mkdirs(todayPath, err => {
      if (err) console.error(err);

      _fsExtra2.default.copy(templateDataPath, dataJSONPath, err => {
        if (err) console.error(err);

        _fsExtra2.default.readJson(yesterdayDataJSONPath, (err, yesterdayObj) => {
          let hasPreviousNote = true;
          let incompleteTasks = [];

          if (err && err.code === 'ENOENT') {
            hasPreviousNote = false;
          }

          if (hasPreviousNote) {
            incompleteTasks = Object.keys(yesterdayObj).map(section => {
              return yesterdayObj[section].items.filter(item => {
                return item.status !== "complete";
              });
            })[0];
          }

          _fsExtra2.default.readJson(dataJSONPath, (err, noteObj) => {
            console.log(`Creating new note from the ${ _chalk2.default.green(template) } template...`);
            if (hasPreviousNote && incompleteTasks.length > 0) {
              console.log(`\nCopying ${ _chalk2.default.cyan(incompleteTasks.length) } incomplete tasks from yesterday:`);
              incompleteTasks.forEach((task, i) => console.log(`   ${ _chalk2.default.cyan(i) }.) ${ task.description }`));
              const firstNote = Object.keys(noteObj)[0];
              const mergedItems = [...incompleteTasks, ...noteObj[firstNote].items];
              noteObj[firstNote].items = mergedItems;
            }

            _fsExtra2.default.writeJson(dataJSONPath, noteObj, err => {
              if (err) return console.error(err);

              Utils.makeNote(noteObj);
              const watchCmd = 'nono watch';
              console.log(`\nGreat success! Here is your note for today: \n${ _chalk2.default.cyan(noteMdPath) }`);
              console.log(`\nYou can see the note by running ${ _chalk2.default.green(watchCmd) } anywhere in your console!`);
            });
          });
        });
      });
    });
  });
});

_commander2.default.command('watch').alias('w').description('watches todays note').action(function () {
  (0, _co2.default)(function* () {
    const today = (0, _moment2.default)().format("DD-MM-YYYY");
    var configPath = `${ process.env.HOME }/.nonoterc.json`;
    _fsExtra2.default.readJson(configPath, (err, configJSON) => {
      if (err) console.error(err);

      const notesDir = configJSON.notesDirectory;
      const days = `${ notesDir }/days/`;
      const toDir = days + today;
      const noteMd = `${ toDir }/note.md`;

      _fsExtra2.default.access(noteMd, _fsExtra2.default.constants.F_OK, err => {
        if (err && err.code === 'ENOENT') {
          const badNotePath = _chalk2.default.cyan(noteMd);
          const newNoteCmd = _chalk2.default.green('nono new');
          console.log(`
Oh man, oh jeez, ok, I-I-I can't access this note:
${ badNotePath }

C-c-can you try m-m-making a new note or s-s-something?
${ newNoteCmd }
            `);
          return;
        }

        _fsExtra2.default.readFile(noteMd, (err, data) => {
          if (err) throw err;
          console.log('\x1Bc');
          console.log(data.toString());
        });

        _fsExtra2.default.watch(noteMd, () => {
          _fsExtra2.default.readFile(noteMd, (err, data) => {
            if (err) throw err;
            console.log('\x1Bc');
            console.log(data.toString());
          });
        });
      });
    });
  });
});

_commander2.default.command('section').alias('s').description('create new section').action(function () {
  (0, _co2.default)(function* () {
    const sectionName = yield (0, _coPrompt2.default)('New section name: ');
    const cliRefName = yield (0, _coPrompt2.default)('Cli reference key: ');
    const description = yield (0, _coPrompt2.default)('Short description: ');

    Utils.createSection(sectionName, cliRefName, description);

    console.log(_chalk2.default.green(`new section '${ sectionName }' was created!`));
  });
});

_commander2.default.command('init').description('initializes notes').action(function () {
  (0, _co2.default)(function* () {
    const notesDirPath = yield (0, _coPrompt2.default)('notes directory path (from $HOME): ');
    const homePath = `${ process.env.HOME }/${ notesDirPath }`;
    Utils.initializeNotes(homePath);

    const shouldCreate = yield _coPrompt2.default.confirm(`Would you like me to create "${ homePath }" for you?(Recommended) [y/N] `);
    Utils.createDir(shouldCreate, homePath);
    console.log('Start taking notes with', _chalk2.default.cyan('nonote new!'));
    // TODO: create a readme
    process.exit();
  });
});

_commander2.default.command('add <cli-ref> [notes...]').alias('a').description('add note to object').action(function (ref, note) {
  try {
    Utils.addNote(note, ref);
    console.log(_chalk2.default.green('note added!'));
  } catch (e) {
    console.log(_chalk2.default.red(e));
  }
});

_commander2.default.command('remove <cli-ref> [index]').alias('r').option('-s, --section', 'remove a seciton').description('remove note from note object').action(function (ref, note, options) {
  if (options.section && note === undefined) {
    Utils.removeSection(ref);
  } else {
    try {
      Utils.changeStatus(note, ref, Utils.removeNote);
      console.log(_chalk2.default.green(`note at index[${ note }] was removed!`));
    } catch (e) {
      console.log(_chalk2.default.red(e));
    }
  }
});

_commander2.default.command('complete <cli-ref> [index]').alias('c').description('mark item as complete').action(function (ref, note) {
  try {
    Utils.changeStatus(note, ref, Utils.completeNote);
    console.log(_chalk2.default.green(`note at index[${ note }] was marked as complete!`));
  } catch (e) {
    console.log(_chalk2.default.red(e));
  }
});

_commander2.default.command('incomplete <cli-ref> [index]').alias('i').description('mark item as incomplete').action(function (ref, note) {
  try {
    Utils.changeStatus(note, ref, Utils.incompleteNote);
    console.log(_chalk2.default.green(`note at index[${ note }] was marked as incomplete!`));
  } catch (e) {
    console.log(_chalk2.default.red(e));
  }
});

_commander2.default.command('failed [cli-ref] <index>').alias('f').description('mark item as failed').action(function (ref, note) {
  try {
    Utils.changeStatus(note, ref, Utils.failNote);
    console.log(_chalk2.default.green(`note at index[${ note }] was marked as failed :(`));
  } catch (e) {
    console.log(_chalk2.default.red(e));
  }
});

_commander2.default.parse(process.argv);
//# sourceMappingURL=main.js.map