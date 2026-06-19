Title: Process JSON with jq
Date: 2026-06-19
Slug: process-json-with-jq
Tags: command-line, data-engineering
Summary: jq will make you love JSON.
Status: draft

I have a love-hate relationship with JSON.

It gets the job done, but the syntax can be annoying.

That's why have a love-love relationship with jq. 😍

No matter how messy the JSON gets, jq is there to make sense of it.

We're checking out the jq command line tool. By the end, you'll be able to easily handle JSON data with jq's superpowers.

## The Basics
First up, think of jq as a filter on a stream of JSON data. It receives some input and returns some output.

Filters either extract something from the JSON or manipulate something within the JSON. 

Let's look at example filters with a toy JSON object:

```json
{
  "school": "Hogwarts",
  "headmaster": "Albus Dumbledore",
  "students": [
    {
      "name": "Harry Potter",
      "house": "Gryffindor",
      "year": 5,
      "owl_count": 7
    },
    {
      "name": "Hermione Granger",
      "house": "Gryffindor",
      "year": 5,
      "owl_count": 10
    },
    {
      "name": "Draco Malfoy",
      "house": "Slytherin",
      "year": 5,
      "owl_count": 6
    }
  ],
  "subjects": [
    "Potions",
    "Defense Against the Dark Arts",
    "Transfiguration"
  ]
}
```

The simplest filter is the "identity filter" given by `.`. This returns the data as it is. It's not super exciting, but at the very least, it pretty-prints the JSON.

`jq` will either read stream of JSON objects from stdin. Or give it a file path, and jq will read JSON objects from the file.

Here's one way to apply the `.` filter to the `hogwarts.json` file:

```bash
> jq '.' hogwarts.json
```

[insert screenshot of identity filter]

When you see the `.`, think if it as "this object."

To make the file size smaller, the JSON can be minified using the compact flag `-c`.

```bash
> jq -c '.' hogwarts.json
{"school":"Hogwarts","headmaster":"Albus Dumbledore","students":[{"name":"Harry Potter","house":"Gryffindor","year":5,"owl_count":7},{"name":"Hermione Granger","house":"Gryffindor","year":5,"owl_count":10},{"name":"Draco Malfoy","house":"Slytherin","year":5,"owl_count":6}],"subjects":["Potions","Defense Against the Dark Arts","Transfiguration"]}
```

Nice! Let's dig into this JSON object.

To get the value of a certain key, use the `.<key-name>` filter:

```bash
> jq '.school' hogwarts.json
"Hogwarts"
```

Want to extract an array? No problem:

```bash
> jq '.students' hogwarts.json
[
  {
    "name": "Harry Potter",
    "house": "Gryffindor",
    "year": 5,
    "owl_count": 7
  },
  {
    "name": "Hermione Granger",
    "house": "Gryffindor",
    "year": 5,
    "owl_count": 10
  },
  {
    "name": "Draco Malfoy",
    "house": "Slytherin",
    "year": 5,
    "owl_count": 6
  }
]
```

Since the `students` key has an array as its value, the `.students` filter returns an array. To return each element of the array as a separate JSON object, use the array iterator `.[]`. Here we use the `.students[]` filter. Note how the output is no longer an array; it's 3 separate JSON objects.

```bash
> jq '.students[]' hogwarts.json
{
  "name": "Harry Potter",
  "house": "Gryffindor",
  "year": 5,
  "owl_count": 7
}
{
  "name": "Hermione Granger",
  "house": "Gryffindor",
  "year": 5,
  "owl_count": 10
}
{
  "name": "Draco Malfoy",
  "house": "Slytherin",
  "year": 5,
  "owl_count": 6
}
```

That same `.[]` notation is used for indexing and slicing. What if we wanted the name of the 2nd student the students array?


```bash
> jq '.students[1]' hogwarts.json
{
  "name": "Hermione Granger",
  "house": "Gryffindor",
  "year": 5,
  "owl_count": 10
}
```

That's right, jq uses 0-based indexing. `.students[1]` gives the item in the 2nd position of the array.

Maybe that's too much output. We can string keys together to get nested values. Here's how to get the value for the `name` key for the 2nd student:

```bash
> jq '.students[1].name' hogwarts.json
"Hermione Granger"
```

By default, jq returns JSON strings quotes. Toif we want simple strings without quotes, we can use the `-r` flag ("r" for raw):

```bash
> jq -r '.students[1].name' hogwarts.json
Hermione Granger
```

Let's camp out on the students array. Suppose you want to figure out how many elements are in the array. That can be done by using the `length` filter.

```bash
> jq '.students | length' hogwarts.json
3
```

That's right! Filters can be combined by piping the output of one filter to another. The first filter `.students` extracts the students array. The `|` character passes the output of the first filter to the `length` filter... which (unsurprisingly) gives the length of the array.

What if we want to filter the students to array to get our favorite Gryffindor members. That's where `select` comes in:

```bash
> jq '.students[] | select(.house == "Gryffindor") | {name, house}' hogwarts.json
{
  "name": "Harry Potter",
  "house": "Gryffindor"
}
{
  "name": "Hermione Granger",
  "house": "Gryffindor"
}
```

This one's got a nice chain of 3 filters. The 2nd filter `select(.house == "Gryffindor")` emits any objects where the key "house" has a value of "Gryffindor". The 3rd filter `{name, house}` picks the keys we want in the final output; this removes the `year` and `owl_count` key-values.

jq also allows arithmetic. Suppose causes mischief and fudges the `owl_count`: 

```bash
> jq '.students[] | {name, owl_count: (.owl_count - 5)}' hogwarts.json
{
  "name": "Harry Potter",
  "owl_count": 2
}
{
  "name": "Hermione Granger",
  "owl_count": 5
}
{
  "name": "Draco Malfoy",
  "owl_count": 1
}
```

Here, the `owl_count` value is subtracted by 5. The other operations you may expect are in jq, too (addition , multiplication, exponents, etc)

- create objects
- raw output
- conditionals - if statement

## The Real World

Alright, those examples are cute. But real JSON isn't so small. In the real world, you call an API and are hit with this beauty:

```json
{"data":[{"id":"1fcca6dd-f25d-414f-889a-e99b0c4b40c4","type":"spell","attributes":{"slug":"age-line","category":"Charm","creator":null,"effect":"Prevented people above or below a certain age from access to a target","hand":null,"image":"https://static.wikia.nocookie.net/harrypotter/images/e/e5/Age_Line_surrounding_the_Goblet_of_Fire_PM.jpg","incantation":null,"light":"Blue","name":"Age Line","wiki":"https://harrypotter.fandom.com/wiki/Age_Line"},"links":{"self":"/v1/spells/1fcca6dd-f25d-414f-889a-e99b0c4b40c4"}},{"id":"6e723990-3406-415d-a9fc-3d4ef5ba1019","type":"spell","attributes":{"slug":"alarte-ascendare","category":"Charm","creator":null,"effect":"Rocketed target upward","hand":"Brandish wand","image":"https://static.wikia.nocookie.net/harrypotter/images/c/c4/Alarte_Ascendare.gif","incantation":"Alarte Ascendare(a-LAR-tay a-SEN-der-ay)","light":"Red","name":"Alarte Ascendare","wiki":"https://harrypotter.fandom.com/wiki/Alarte_Ascendare"},"links":{"self":"/v1/spells/6e723990-3406-415d-a9fc-3d4ef5ba1019"}},{"id":"4c184d5e-f762-4deb-b16b-705a8a13f00f","type":"spell","attributes":{"slug":"albus-dumbledore-s-forceful-spell","category":"Spell","creator":null,"effect":"Great force","hand":"Flick wand","image":null,"incantation":null,"light":"None","name":"Albus Dumbledore's forceful spell","wiki":"https://harrypotter.fandom.com/wiki/Albus_Dumbledore's_forceful_spell"},"links":{"self":"/v1/spells/4c184d5e-f762-4deb-b16b-705a8a13f00f"}},{"id":"758d28c2-c26b-40c5-aaa9-697355f53875","type":"spell","attributes":{"slug":"alohomora-duo","category":"Charm","creator":null,"effect":"Stronger variation of the Unlocking Charm","hand":null,"image":null,"incantation":"Alohomora Duo","light":null,"name":"Alohomora Duo","wiki":"https://harrypotter.fandom.com/wiki/Alohomora_Duo"},"links":{"self":"/v1/spells/758d28c2-c26b-40c5-aaa9-697355f53875"}},{"id":"a8f39fce-148b-4502-9267-84571828b0f6","type":"spell","attributes":{"slug":"altering-spell","category":"Transfiguration","creator":null,"effect":"Transformed the physical form or colour of objects","hand":null,"image":"https://static.wikia.nocookie.net/harrypotter/images/3/36/Altering_HL.gif","incantation":null,"light":"White","name":"Altering Spell","wiki":"https://harrypotter.fandom.com/wiki/Altering_Spell"},"links":{"self":"/v1/spells/a8f39fce-148b-4502-9267-84571828b0f6"}},{"id":"f420df2a-8b53-4f12-aa40-50eff29742f6","type":"spell","attributes":{"slug":"amplificus","category":null,"creator":null,"effect":null,"hand":null,"image":null,"incantation":"Amplificus","light":null,"name":"Amplificus","wiki":"https://harrypotter.fandom.com/wiki/Amplificus"},"links":{"self":"/v1/spells/f420df2a-8b53-4f12-aa40-50eff29742f6"}},{"id":"c736cdc4-6edf-408b-b14f-8154f32141fe","type":"spell","attributes":{"slug":"amplifying-charm","category":"Charm","creator":null,"effect":"Loudens target","hand":"Direct at target","image":"https://static.wikia.nocookie.net/harrypotter/images/2/29/Sonorous_GOF_Dumbledore_1.jpg","incantation":"Sonorus(soh-NOHR-us)","light":"None","name":"Amplifying Charm","wiki":"https://harrypotter.fandom.com/wiki/Amplifying_Charm"},"links":{"self":"/v1/spells/c736cdc4-6edf-408b-b14f-8154f32141fe"}},{"id":"71df708b-32fc-4811-9bfe-77e52709b70d","type":"spell","attributes":{"slug":"anapneo","category":"Healing spell, Vanishment, Charm","creator":null,"effect":"Cleared target's airway by vanishing blockages","hand":"Point wand at target","image":"https://static.wikia.nocookie.net/harrypotter/images/2/2e/Celestina_Warbeck%27s_throat_unblocked_HM.png","incantation":"Anapneo(ah-NAP-nee-oh)","light":null,"name":"Anapneo","wiki":"https://harrypotter.fandom.com/wiki/Anapneo"},"links":{"self":"/v1/spells/71df708b-32fc-4811-9bfe-77e52709b70d"}},{"id":"c982485d-33df-4f40-a9e7-ef88c08361b5","type":"spell","attributes":{"slug":"animagus-spell","category":"Transfiguration","creator":null,"effect":"Used as part of the ritual to become an Animagus","hand":"Place wand tip over caster's heart","image":"https://static.wikia.nocookie.net/harrypotter/images/2/2d/Animagus_Spell_HM.png","incantation":"Amato Animo Animato Animagus(ah-MAH-toh ah-NEE-moh ah-nee-MAH-toh an-ee-MAY-gus)","light":"Golden","name":"Animagus Spell","wiki":"https://harrypotter.fandom.com/wiki/Animagus_Spell"},"links":{"self":"/v1/spells/c982485d-33df-4f40-a9e7-ef88c08361b5"}},{"id":"b62ee9c6-2cbb-46b8-864b-6a00960e4cfc","type":"spell","attributes":{"slug":"animation-charm","category":"Charm","creator":null,"effect":"Animated target","hand":"Hold wand aloft or wave (when animating multiple things)","image":"https://static.wikia.nocookie.net/harrypotter/images/e/e5/Piertotum_Locomotor.gif","incantation":"Piertotum Locomotor(peer-TOH-tuhm loh-kuh-MOH-tor)","light":"None","name":"Animation Charm","wiki":"https://harrypotter.fandom.com/wiki/Animation_Charm"},"links":{"self":"/v1/spells/b62ee9c6-2cbb-46b8-864b-6a00960e4cfc"}},{"id":"799527e6-b72a-4d79-a29a-de9be330a299","type":"spell","attributes":{"slug":"anteoculatia","category"
```

Be thankful. I'm showing you just the first 5,000 characters. There's more.

Large files with compact JSON like this is where jq shines. We'll demo how to make sense of this API output.

First, what keys does the response have?

```bash
> jq 'keys' spells.json
[
  "data",
  "links",
  "meta"
]
```

Looks like there 3 keys. Let's see what's in the `data` key:

```bash
> jq '.data | length' spells.json
100
```

There are 100 objects in `data`! Definitely don't want to print all of that at once. Let's see the first object:

```bash
> jq '.data[0]' spells.json
{
  "id": "1fcca6dd-f25d-414f-889a-e99b0c4b40c4",
  "type": "spell",
  "attributes": {
    "slug": "age-line",
    "category": "Charm",
    "creator": null,
    "effect": "Prevented people above or below a certain age from access to a target",
    "hand": null,
    "image": "https://static.wikia.nocookie.net/harrypotter/images/e/e5/Age_Line_surrounding_the_Goblet_of_Fire_PM.jpg",
    "incantation": null,
    "light": "Blue",
    "name": "Age Line",
    "wiki": "https://harrypotter.fandom.com/wiki/Age_Line"
  },
  "links": {
    "self": "/v1/spells/1fcca6dd-f25d-414f-889a-e99b0c4b40c4"
  }
}
```

Ah, so this is a collection of spells. There's a lot of extra information here. Let's just get the name of each spell: 

```bash
> jq '.data[].attributes.name' spells.json
"Age Line"
"Alarte Ascendare"
"Albus Dumbledore's forceful spell"
"Alohomora Duo"
"Altering Spell"
"Amplificus"
"Amplifying Charm"
"Anapneo"
"Animagus Spell"
"Animation Charm"
"Anteoculatia"
"Anti-Apparition Charm"
"Anti-Cheating Spell"
"Anti-Disapparition Jinx"
# ... continues
```

Okay, now we have a sense of the API response. We can also get the categories of each spell. Here we create a JSON array (with `[]`) containing each spell's category. The array is then piped to the `unique` filter to deduplicate the categories: 

```bash
> jq '[.data[].attributes.category] | unique' spells.json
[
  null,
  "Charm",
  "Charm, Conjuration",
  "Charm, Counter-charm",
  "Charm, Curse",
  "Conjuration",
  "Curse",
  "Curse, Healing spell",
  "Dark charm",
  "Healing spell, Charm",
  "Healing spell, Charm, Conjuration",
  "Healing spell, Vanishment, Charm",
  "Hex",
  "Jinx",
  "Jinx, Conjuration",
  "Magical transportation",
  "Spell",
  "Transfiguration",
  "Transfiguration, Jinx",
  "Transfiguration, jinx",
  "Transformation"
]
```

Clearly, there is opportunity for data cleanup here.



---

We've just begun with jq. It's a full-fledged language with many bells and whistles. There is much to learn at the [jq docs](https://jqlang.org/manual/).

jq typically comes pre-loaded on Linux distros and MacOS. In case you don't have it, check the [jq download page](https://jqlang.org/download/).

JSON is hte lingua franca of web communication. But processing it can be a pain. The next time you have a mountain of JSON to look at, give jq a whirl. You'll thank youself. 
