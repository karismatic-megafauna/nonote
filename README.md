# nonote

Nonote is a Command Line Node application for taking notes from the command line in Git Hub flavored Markdown!
> Disclaimer, I have not tested this on anything but a mac...so please report funk on other Linux distros

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
│   └── 02-04-2016
│       ├── data.json
│       └── note.md
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

### Watch your Notes

```sh
nono watch
```
Will run a watch command on todays `note.md` file in the directory specified by
your `.nonoterc.json`

Having a textfile that you are watching for changes is the heart of nonote!

### Add some notes

Now that you have a place to take some notes, let's add some tasks for you to do!

```sh
$ nono add <section> <ENTER NOTE DISCRIPTION HERE>
nono add wn fix that darn bug
nono a wn apologize to support
```
![nono add](https://media.giphy.com/media/xTiQysI4UDzlf8HIpW/giphy.gif)

This will add a note in the "work notes" section! Yay!

### Toggle some statuses

Great! you have some tasks to do! Let's Update their statusesesesesssz

Here is the general formula to change a notes status:
```sh
$ nono [ complete (c) || incomplete (i) || failed (f) || remove (r) ] <section> <index>
```

#### Complete a note
```sh
nono c wn 1
```
Yay! You solved that darn bug! Check that off your list :)

![nono complete](https://media.giphy.com/media/l4hLxLPsF9HjGoxnG/giphy.gif)
Mark note `1` in the `wn` section as complete with github flavoured markdown: `- [x]`


#### Incomplete a note
```sh
nono i wn 1
```
Aw Cuss! You didn't _actually_ complete that task, change it's status :(

![nono incomplete](https://media.giphy.com/media/26CYzMaBBuYFBQ3Pa/giphy.gif)
Mark note `1` in the `wn` section as incomplete with github flavoured markdown: `- [ ]`

#### Fail a note
```sh
nono f wn 1
```
Holy cats that bug is just impossible to fix, mark it as failed.

![nono incomplete](https://media.giphy.com/media/3o85fZPjuKGC0eNlMQ/giphy.gif)
Mark note `1` in the `wn` section as incomplete with what I am using to represent a third state in a binary system ... `- [-]`

#### Remove a note
```sh
nono r wn 1
```
You didn't need to do that task anyways, f it!

![nono incomplete](https://media.giphy.com/media/3oGRFwIRkw7ytv5pa8/giphy.gif)
Remove note `1` in the `wn` section

#### Remove a section
```sh
nono r wn -s
```
Ya know what? You don't even need that whole section!

![nono incomplete](https://media.giphy.com/media/3oGRFta0BNx80wnDvq/giphy.gif)
Remove section `wn`

#### Add a section
```sh
nono s
```
Oh wait, yes you do...

![nono incomplete](https://media.giphy.com/media/3oGRFwVYo1hPwgkHQs/giphy.gif)
The cli ref is how you will reference this note from the cli, so make it short!

---

And that is basically nonote!

# Roadmap
A few things I would really like to add to nonote are:
- Note rollover (for incomplete tasks)
- Weekly roundup
- Tests...should have TDD'd this :/ oh well!

# Misc
Here are some template ideas:
- Exercise template
- Coding template
- Work template
- Travel template

# Contributing
Always looking for contributors, no matter how big or small, any PR is an appreciated one :)
If you want to be on this repo send me an email or a tweet!

## Contact me
> the electronic mailz --> michaelghinrichs@gmail.com
> the tweeter --> @mghinrichs
