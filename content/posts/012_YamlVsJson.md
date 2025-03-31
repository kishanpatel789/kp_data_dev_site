Title: YAML vs JSON Config Files
Date: 2025-04-01
Slug: yaml-vs-json-config-files
Tags: system-design
Summary: All apps have config files. But should you use YAML or JSON? (Please don't say XML)
Status: published
MetaImage: /static/images/post012/ConfigScales.jpeg

Confession: I'm cheating on my first love. 

[JSON](https://www.json.org/json-en.html) is great. She's always there for me. I tell her my deepest secrets, and she keeps them safe. She's dependable and helps me talk with others. 

But my recent fling with YAML has me wondering... Is there someone better out there? Someone who just gets me better than JSON does? 

Lately, I've fallen in love with [YAML](https://yaml.org/). Yes, she makes my config files more readable. But she does so much more than that. 

## What are you talking about, weirdo?
All apps have configuration. This is typically a file that contains the app settings, letting you make tweaks without digging into the code base. 

<div class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div class="w-full md:w-[48%]">

Often, config files are written in JSON and look like this: 

```json
{
  "app": {
    "name": "DefenseAgainstTheDarkArts",
    "version": "0.0.1",
    "debug": false,
    "secret_key": "ssshhh-my-api-key-alohomora"
  },
  "server": {
    "host": "0.0.0.0",
    "port": 8080
  },
  "database": {
    "engine": "postgresql",
    "host": "db.hogwarts.edu",
    "port": 5432,
    "username": "dobby",
    "password": "sssshhh-secret-database-password",
    "name": "public",
    "pool_size": 10
  },
  "logging": {
    "level": "info",
    "format": "json",
    "output": "logs/app.log"
  }
}
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div class="w-full md:w-[48%]">

But lately, I'm flirting with config files that look like this: 

```yaml
app:
  name: DefenseAgainstTheDarkArts
  version: 0.0.1
  debug: false
  secret_key: ssshhh-my-api-key-alohomora
server:
  host: 0.0.0.0
  port: 8080
database:
  engine: postgresql
  host: db.hogwarts.edu
  port: 5432
  username: dobby
  password: sssshhh-secret-database-password
  name: public
  pool_size: 10
logging:
  level: info
  format: json
  output: logs/app.log
```

</div>
</div>


Both config files have the same content. The app can read either file to see the server it's running on, how to access the backend database, and where to send the logs. 

But these two beauties *look* different. Today we'll see the differences and why YAML is my new "main squeeze." 

## Cleaner Format
Readability is important. Code is written for machines, but we feeble humans need to read that code, too. 

Look again at the two examples above. Notice what's missing from the YAML version? 

- No quotes
- No braces (`{}`)
- No commas

YAML's already looking easy on the eyes. &#128525; 

While JSON uses commas and braces to define structure, YAML's structure is built upon whitespace and indentation. It's subtle, but without these extra characters, I can read the file more quickly. And I don't have to worry about forgetting a comma or an unclosed brace when editing the file. 

Quick side note: Both JSON and YAML are built on the concept of key-value pairs. 

- **Keys** usually name things you want to track. Keys appear before the colon (`:`). (See green-bold items in examples above)
- Each key has a **value** which appears after the colon (`:`). A value can be a string, number, boolean (true/false), list, or even another collection of key-value pairs. 

Okay, back to my raving: One of my favorite features of YAML is how she handles long strings. With JSON, you're stuck scrolling...

```json
{
  "spells": {
    "patronus_charm": {
      "incantation": "Expecto Patronum",
      "description": "The Patronus Charm is an advanced defensive spell that conjures a positive energy force, often taking the form of an animal that represents the caster's spirit. It is primarily used to repel Dementors, creatures that feed on human happiness. Only those who can summon deeply positive memories can successfully cast a Patronus.\n"
    }
  }
}
```

But with YAML, you can break long, single-line strings across multiple lines with the fold operator (`>`): 

```yaml
# file: config_longstring.yaml
spells:
  patronus_charm:
    incantation: "Expecto Patronum"
    description: >                 # fold line-breaks into one line with `>`
      The Patronus Charm is an advanced defensive spell that conjures a
      positive energy force, often taking the form of an animal that
      represents the caster's spirit. It is primarily used to repel
      Dementors, creatures that feed on human happiness.
      Only those who can summon deeply positive memories can successfully
      cast a Patronus.
```

This gives you the best of both worlds:

1. In your YAML file, you split the string among multiple lines to make the text more readable (no horizontal scrolling). 
2. When your app reads the file, it replaces the line breaks with whitespace, recreating the long, single-line string for use in the app logic. 

Here's how python would interpret the file:

```python
import yaml
with open(f"./config_longstring.yaml", "r") as f:
  config_yaml = yaml.safe_load(f)

# config file converted to python dictionary `config_yaml`: 
# line breaks replaced with whitespace
{
  'spells': {
    'patronus_charm': {
      'incantation': 'Expecto Patronum', 
      'description': "The Patronus Charm is an advanced defensive spell that conjures a positive energy force, often taking the form of an animal that represents the caster's spirit. It is primarily used to repel Dementors, creatures that feed on human happiness. Only those who can summon deeply positive memories can successfully cast a Patronus.\n"
    }
  }
}
```

BUT if you want to keep line breaks, you can use the pipe operator (`|`): 

```yaml
# file: config_longstring.yaml (updated)
spells:
  patronus_charm:
    incantation: "Expecto Patronum"
    description: |                 # preserve line breaks with `|`
      The Patronus Charm is an advanced defensive spell that conjures a
      positive energy force, often taking the form of an animal that
      represents the caster's spirit. It is primarily used to repel
      Dementors, creatures that feed on human happiness.
      Only those who can summon deeply positive memories can successfully
      cast a Patronus.
```

The YAML parser will read the string block literally and respect line breaks. Note how line breaks are identified by the new line character (`\n`) when the file loads again:

```python
# config file converted to python dictionary: 
# line breaks preserved (\n)
{
  'spells': {
    'patronus_charm': {
      'incantation': 'Expecto Patronum',
      'description': "The Patronus Charm is an advanced defensive spell that conjures a\npositive energy force, often taking the form of an animal that\nrepresents the caster's spirit. It is primarily used to repel\nDementors, creatures that feed on human happiness.\nOnly those who can summon deeply positive memories can successfully\ncast a Patronus.\n"
    }
  }
}
```

This gives you options. You have more control over how the file is arranged for human readability and how the machine will interpret the file. 

## Comments
Want to use comments in your JSON config?

Too bad. You can't.

But you can with YAML. Just use the hash symbol (`#`): 

```yaml
app:
  name: DefenseAgainstTheDarkArts
  version: 0.0.1
  environment: development  # options: development, staging, production
  debug: true               # WARNING: set this to false before deploying
  secret_key: ssshhh-my-api-key-alohomora
server:
  host: 0.0.0.0
  port: 8080
```

Comments reveal a setting's possible values and draw attention to important sections. They share the intent and design of the config, which is like gold to other developers (and you 6 months from now). 

Unfortunately, the JSON specification doesn't allow comments. In YAML, you can use comments to record what you were thinking when writing the file.

## Re-Use Code
Do you like repeating yourself? 

<div class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2">
<div class="w-full md:w-[48%]">

If so, keep using JSON: 

```json
{
  "services": {
    "api": {
      "host": "0.0.0.0",
      "port": 8080,
      "logging": {
        "level": "info",
        "format": "json",
        "output": "logs/app.log"
      }
    },
    "worker": {
      "concurrency": 4,
      "logging": {
        "level": "info",
        "format": "json",
        "output": "logs/app.log"
      }
    }
  },
  "databases": {
    "primary": {
      "engine": "postgresql",
      "host": "db.hogwarts.edu",
      "port": 5432,
      "username": "dobby",
      "password": "sssshhh-secret-database-password",
      "pool_size": 10,
      "name": "primary_db"
    },
    "replica": {
      "engine": "postgresql",
      "host": "db.hogwarts.edu",
      "port": 5432,
      "username": "dobby",
      "password": "sssshhh-secret-database-password",
      "pool_size": 10,
      "name": "replica_db",
      "read_only": true
    }
  }
}
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div class="w-full md:w-[48%]">

If not, use YAML: 

```yaml
services:
  api:
    host: 0.0.0.0
    port: 8080
    logging: &default_logging # define logging node as anchor
      level: info
      format: json
      output: logs/app.log
  worker:
    concurrency: 4
    logging: *default_logging  # reuse logging settings

default_database: &default_db
  engine: postgresql
  host: db.hogwarts.edu
  port: 5432
  username: dobby
  password: sssshhh-secret-database-password
  pool_size: 10
databases:
  primary: 
    <<: *default_db  # reuse default_db config
    name: primary_db
  replica:
    <<: *default_db  # reuse default_db config
    name: replica_db
    read_only: true
```

</div>
</div>

YAML lets you reuse a node, or part of the config file. You first "anchor" the node and give it an alias with the `&` character. Later you reference that alias with the `*` character. The example above shows how to reuse log settings across services, enabling consistency and the [DRY principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).

You can even merge an aliased node into another node that has extra key-value pairs. Check out our database config in JSON above. The primary and replica databases have many identical settings; only `name` and `read_only` differ. In the YAML version, common settings are in the `default_database` node, aliased as (`&default_db`). `default_db` is merged into the primary and replica settings with the `<<` operator; right after that, the settings unique to each environment are defined (`name` and `read_only`). 

YAML's anchors reduce future bugs. Let's face it: We've all introduced bugs when we updated the password for the primary database but forgot to update the password for the replica. With the YAML pattern above, we can safely update our config in one place and sleep better at night. 

---

I can go on and on about my love, but I think you get it. 

YAML is relatively new but has rapidly grown in popularity. Here's where you can find her in the wild:

- [Docker Compose Files](https://docs.docker.com/compose/)
- [Github Actions Workflows](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [dbt Model Configuration](https://docs.getdbt.com/reference/model-configs)
- [Kubernetes Configuration](https://kubernetes.io/docs/concepts/configuration/overview/)

JSON is a long-time industry standard and used to transmit data between machines. I'll still use JSON for my projects. But where possible, I'm going to flirt with YAML for a more human touch. 

If you're a nerd like me, read the YAML spec (i.e. the boring manual) at [yaml.org](https://yaml.org/spec/1.2.2/).

And if you want training on software design, [give me call](https://kpdata.dev/). Like YAML, you'll find me... approachable.
