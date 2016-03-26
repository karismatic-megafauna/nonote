# nonote
Personalized CLI note taking application in node


## Usage
```sh
$ nonote new
 ```
Create a new note for the day from your template

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
