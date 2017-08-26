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
    const notePath = Utils.getDateDir();
    const noteJSON = `${notePath}/data.json`;
    const rootDir = Utils.getRootDir();
    const templateData = `${rootDir}/templates/${template}.json`;

    console.log(`creating new note from the ${chalk.cyan(template)} template!`);

    fs.mkdirsSync(notePath);
    fs.copySync(templateData, noteJSON);
    Utils.makeNote(fs.readJsonSync(noteJSON));

    console.log(`\nnew note created for today: \n${chalk.cyan(notePath)}`);
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
            const badNotePath = chalk.blue(noteMd);
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

      const shouldCreate = yield prompt.confirm(`Would you like me to create "${homePath}" for you?(Recommended) [y/N] `);
      Utils.createDir(shouldCreate, homePath);
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

