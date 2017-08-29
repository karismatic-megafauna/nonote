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
import * as Utils from './utils';

program
  .version('0.0.1')
  .command('new [template]')
  .alias('n')
  .description('create a new note for the day')
  .action(function(template, cmd) {
    if(!template) {
      template = 'default';
    }
    const today = moment().format("DD-MM-YYYY");
    const yesterday = moment().subtract(1, 'day').format("DD-MM-YYYY");
    var configPath = `${process.env.HOME}/.nonoterc.json`;

    fs.readJson(configPath, (err, configObj) => {
      if (err) console.error(err)

      const notesDir = configObj.notesDirectory;
      const days = `${notesDir}/days/`;
      const todayPath = days + today;
      const yesterdayPath = days + yesterday;
      const yesterdayDataJSONPath= `${yesterdayPath}/data.json`;
      const dataJSONPath = `${todayPath}/data.json`;
      const noteMdPath = `${todayPath}/note.md`;

      const templateDataPath = `${notesDir}/templates/${template}.json`;

      fs.mkdirs(todayPath, (err) => {
        if (err) console.error(err)

        fs.copy(templateDataPath, dataJSONPath, (err) => {
          if (err) console.error(err)

          fs.readJson(yesterdayDataJSONPath, (err, yesterdayObj) => {
            let hasPreviousNote = true;
            let incompleteSections = [];

            if (err && err.code === 'ENOENT') {
              hasPreviousNote = false;
            }

            if (hasPreviousNote) {
              incompleteSections = Object.keys(yesterdayObj).map(section => {
                const incompleteItems = yesterdayObj[section].items.filter(item => {
                  return item.status !== "complete"
                });

                return {
                  [section]: {
                    items: incompleteItems,
                    description: yesterdayObj[section].description,
                    ['cli-ref']: yesterdayObj[section]['cli-ref'],
                  }
                }
              });
            }

            fs.readJson(dataJSONPath, (err, noteObj) => {
              console.log(`Creating new note from the ${chalk.green(template)} template...`);
              if (hasPreviousNote && incompleteSections.length > 0) {
                incompleteSections.forEach((incompleteSection) => {
                  Object.keys(incompleteSection).map((name) =>{
                    console.log(`\nCopying ${chalk.yellow(name)} incomplete tasks from yesterday:`);
                    const currentSection = incompleteSection[name];
                    currentSection.items.forEach((item, i) =>  {
                      const number = chalk.bold(`${i}.)`);
                      const description = chalk.hex('#a1a1a1').bold(item.description);
                      console.log(`   ${number} ${description}`);
                    });

                    if( noteObj[name] === undefined) {
                      noteObj[name] = {
                        items: currentSection.items,
                        description: currentSection.description,
                        ['cli-ref']: currentSection['cli-ref'],
                      };
                    } else {
                      noteObj[name] = {
                        items: [ ...noteObj[name].items, ...currentSection.items ],
                        description: currentSection.description,
                        ['cli-ref']: currentSection['cli-ref'],
                      };
                    }
                  });
                });
              }

              fs.writeJson(dataJSONPath, noteObj, (err) => {
                if (err) return console.error(err)

                Utils.makeNote(noteObj);
                const watchCmd = 'nono watch';
                console.log(`\nGreat success! Here is your note for today: \n${chalk.cyan(noteMdPath)}`);
                console.log(`\nYou can see the note by running ${chalk.green(watchCmd)} anywhere in your console!`);
              });
            })
          });
        });
      });
    });
  });


program
  .command('watch')
  .alias('w')
  .description('watches todays note')
  .action(function(){
    co(function *() {
      const today = moment().format("DD-MM-YYYY");
      var configPath = `${process.env.HOME}/.nonoterc.json`;
      fs.readJson(configPath, (err, configJSON) => {
        if (err) console.error(err)

        const notesDir = configJSON.notesDirectory;
        const days = `${notesDir}/days/`;
        const toDir = days + today;
        const noteMd = `${toDir}/note.md`;

        fs.access(noteMd, fs.constants.F_OK, (err) => {
          if (err && err.code === 'ENOENT') {
            const badNotePath = chalk.cyan(noteMd);
            const newNoteCmd = chalk.green('nono new');
            console.log(`
Oh man, oh jeez, ok, I-I-I can't access this note:
${badNotePath}

C-c-can you try m-m-making a new note or s-s-something?
${newNoteCmd}
            `);
            return;
          }

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
    });
  });


program
  .command('section')
  .alias('s')
  .description('create new section')
  .action(function() {
    co(function *() {
      const sectionName = yield prompt('New section name: ');
      const cliRefName = yield prompt('Cli reference key: ');
      const description = yield prompt('Short description: ');

      Utils.createSection(sectionName, cliRefName, description);

      console.log(chalk.green(`new section '${sectionName}' was created!`));
    });
  });

program
  .command('init')
  .description('initializes notes')
  .action(function() {
    co(function *() {
      const notesDirPath = yield prompt('notes directory path (from $HOME): ');
      const homePath = `${process.env.HOME}/${notesDirPath}`;
      Utils.initializeNotes(homePath);

      Utils.createDir(homePath);
      console.log('Start taking notes with', chalk.green('nonote new!'));
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
      Utils.addNote(note, ref);
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
      Utils.removeSection(ref);
    } else {
      try {
        Utils.changeStatus(note, ref, Utils.removeNote);
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
      Utils.changeStatus(note, ref, Utils.completeNote);
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
      Utils.changeStatus(note, ref, Utils.incompleteNote);
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
      Utils.changeStatus(note, ref, Utils.failNote);
      console.log(chalk.green(`note at index[${note}] was marked as failed :(`));
    } catch (e) {
      console.log(chalk.red(e));
    }
  });

  program.parse(process.argv);

