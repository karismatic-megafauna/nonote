# nonote

Nonote is a Command Line Node application for taking notes from the command line in Git Hub flavored Markdown!

## Motivation

I love being in the terminal, it is so nice. I really dislike how many applications I have 
to have open to do something as simple as have some text with a checkbox next to it. 

The terminal is just fine for that!

Nonote is really useful if you like staying in the terminal and want a place to write
something down but you also don't want to litter your file system with random files.

nonote works best with:
 - tmux / some sort of multiplexed terminal
 - vim / emacs / other terminal based text editor
 - your environments version of `watch cat <file>` (mac will need a `brew install watch`)

## Installation

When installing `nonote` make sure it is done with the -g flag as nonote is
intended to be used in the global context. No matter where you are you should be able
to add a note!

```sh
npm i -g nonote
```

From the command line you can refer to it as `nonote` or `nono`, I prefer the latter :)

## Initialize
Nonote needs to know where you would like to take notes!
This path is stored in a`.nonoterc.json`

The `nono init` command fills this out for you.

```sh
$ nono init
```

![nono init](https://media.giphy.com/media/3oGRFIR51GrfMerzlm/giphy.gif)

It is recommended that you let nonote create your directory as it will also create
a `templates` directory with a `default.json` file that is used for the `nonote new` command.

If you do not let `nonote` create your directory, you *must* adhere to this folder structure:

```
.
├── days
│   ├── 01-04-2016
│   │   ├── data.json
│   │   └── note.md
│   ├── 02-04-2016
│   │   ├── data.json
│   │   └── note.md
│   └── 04-04-2016
│       ├── data.json
│       └── note.md
└── templates
    ├── default.json
    └── weekend.json
```

## Usage

### Start your day

Every day you need to jot some things down, lets make a place you can do that!

```sh
$ nono new [template]
nono new
```
Creates a new note for the day from a specified template:

![nono new](https://media.giphy.com/media/3oGRFDuVhcqBFSfGhO/giphy.gif)

nonote will grab the `default.json` file in `templates` if nothing is specified.

You can add as many templates as you would like! Just make sure they are valid JSON and live in the `templates` directory.

For instance:
`nono new default` starts my day off with a copy of the default template!
`nono new weekend` does the same, just with the weekend template :)

### Add some notes

Now that you have a place to take some notes, let's add some tasks for you to do!

```sh
$ nono add <section> <ENTER NOTE DISCRIPTION HERE>
nono add wn fix production, it's on fire :(
nono a wn apologize to support
```

This will add a note in the "work notes" section! Yay!

### Toggle some statuses

Great! you have some tasks to do! Let's Update their statusesesesesssz

Here is the general formula to change a notes status:
```sh
$ nono [ complete (c) || incomplete (i) || failed (f)|| remove (r) ] <section> <index>
```

Complete a note
```sh
nono c wn 0
```
Will mark note `0` in the `wn` section as complete with github flavoured markdown: `- [x]` 


Incomplete a note
```sh
nono i wn 0
```
Whops! You didn't acutally finish your task! This will mark note `0` in the `wn` section as incomplete with github flavoured markdown: `- [ ]` 


Fail a note
```sh
nono i wn 1
```
You didn't complete the task you set, this will mark note `1` in the `wn` section as incomplete with what I am using to represent a third state in a normally two state checkbox: `- [-]` 

Remove a note
```sh
nono r wn 1
```
You didn't need to do that task anyways, f it!

Ya know what? You don't even need that whole seciton!

```sh
nono r wn -s
```

Oh wait, yes you do...
```sh
nono s
```
This will ask you to enter a some informaiton! The cli ref is how you will reference this note from the cli, so make it short!

And that is basically nonote!

Here are some template ideas:
Exercise template, Coding template, work template, travel template


# Contributing
PR's are always welcome, forking model is fine, if you want to be on this repo send me an email or a tweet!

the electronic mailz --> michaelghinrichs@gmail.com
the tweeter --> @mghinrichs
