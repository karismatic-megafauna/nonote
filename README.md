# nonote
Nonote is a Command Line Node application for taking notes in Git Hub flavored Markdown!

It is really useful if you like staying in the terminal and want a place to write
something down but you also don't want to litter your file system with random files.

A great paring of tools with nonote is:
 - tmux
 - vim
 - your environments version of `watch cat <note>.md` (mac will need a brew install watch)

## Installation
When installing `nonote` make sure it is done with the -g flag as nonote is
intended to be used in the global context. No matter where you are you should be able
to add a note!

```sh
npm i -g nonote
```

## Initialize
Nonote needs to know where you would like to take notes!
This path is stored in a`.nonoterc.json`

The `nono init` command fills this out for you.

```sh
$ nonote init
```

![nono init](https://media.giphy.com/media/3oGRFIR51GrfMerzlm/giphy.gif)


It is recommended that you let nonote create your directory as it will also create
a `templates` directory with a `default.json` file that is used for the `nonote new` command.

If you do not let `nonote` create your directory, you must adhere to this folder structure:

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
```sh
$ nonote new
 ```
Creates a new note for the day from your template

_should add a check on this command to create the templates and default.json if they didn't before_

```sh
$ nonote <ENTER NOTE DISCRIPTION HERE>
```
Adds the note description to a misc object in the note
If no note exists, it creates one with the default template

```sh
$ nonote <Note Title> add <ENTER NOTE DESCRIPTION HERE>
```
Pushes the description to the specified object *key* with the description

```sh
$ nonote complete -2
```
Marks the second element in the object with matching cli-ref *value* as compelete via markdown `- [x]`

```sh
$ nonote delete <cli-ref> -2
```
Deletes the entry at the second location

```sh
$ nonote fail <cli-ref> -2
```
Marks the entry at the second location as failed via markdown `- [-]`


## Example workflow

```sh
$ nonote new
```
```sh
$ nonote add nt Item 4
```

```sh
$ nonote complete nt 2
```

```sh
$ nonote fail nt 2
```

```sh
$ nonote delete nt 2
```

## Template Config
A template will look like this

`a-config.json`
```json
{
  "Note Title": {
    "cli-ref": "nt",
    "description": "meta data about this note",
    "items": [
      {
        "description": "Item 1",
        "status": "complete"
      },
      {
        "description": "Item 2",
        "status": "failed"
      },
      {
        "description": "Item 3",
        "status": "incomplete"
      },
    ]
  }
}
```

`some-config.json`
```json
{
  "Another Note Title": {
    "cli-ref": "ant",
    "description": "meta data about this note",
    "items": [
      {
        "description": "Item 1",
        "status": "complete"
      },
      {
        "description": "Item 2",
        "status": "failed"
      },
      {
        "description": "Item 3",
        "status": "incomplete"
      },
    ]
  }
}
```

## Some rules
- If no template is specified, the default is made.
- If a template is specified, that note will be pre-filled with that template.
- If no object is specified with a new note, it will add it to an object called `Misc`

Ideas:
Exercise template, Coding template, work template, travel template etc


# Contributing
PR's are always welcome, forking model is fine, if you want to be a contributor send me an email or a tweet!
