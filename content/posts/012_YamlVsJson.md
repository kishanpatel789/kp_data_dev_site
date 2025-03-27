Title: YAML vs JSON Config Files
Date: 2025-04-01
Slug: yaml-vs-config-config-files
Tags: system-design
Summary: All apps have config files. But should you use YAML or JSON? (Please don't say XML)
Status: draft

Confession: I'm cheating on my first love. 

JSON's been great. She's always there for me. I tell her my deepest secrets and she keeps them safe. She's dependable and helps me talk to others. 

But my recent fling with YAML has me wondering... Is there someone better? Someone out there who just gets me better than JSON does? 

Lately, I've fallen in love with YAML. Yes, she makes my config files more readable. But she has other features that make my life easier. 

## What are you talking about, weirdo
All apps have configuration. This is typically a file that stores the app settings, allowing you to make tweaks without digging into the code base. 

<div class="flex flex-col md:flex-row md:space-x-2 md:gap-3 py-2 items-stretch">
<div class="w-full md:w-1/2">

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
<div class="w-full md:w-1/2">

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


Both config files have the same content. The app code can read either file to see the server it's running on, how to access the backend database, and where to send the logs. 

But these two beauties look different. Today we'll explore the differences and why YAML is my new "main squeeze." 

## Cleaner Format
Readability is important. Code is written for machines, but we feeble humans need to an easy way to read that code, too. 

Look again at the two examples above. Notice what's missing from the YAML version? 

- No quotes
- No braces (`{}`)
- No commas

YAML's already looking easy on the eyes. &#128525; 

While JSON uses commas and braces to define structure, YAML's structure is built upon whitespace and indentation. It's subtle, but without these extra characters, I can read the file more quickly. And I don't have to worry about forgetting a comma or an unclosed brace when editing the file. 

Quick side note: Both JSON and YAML are built on the concept of key-value objects. 

- **Keys** usually name things you want to track. Keys appear before the colon (`:`). (See green-bold items in examples above)
- Each key has a **value** which appears to the right of the colon (`:`). A value can be a string, number, boolean (true/false), list, or even another object (another collection of key-value pairs). 

Okay, back to my raving: One of my favorite features of YAML is how it handles long strings. In JSON, you're stuck scrolling...

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

But with YAML, you can break long strings across multiple lines using the fold operator (`>`): 

```yaml
# file: config_longstring.yaml
spells:
  patronus_charm:
    incantation: "Expecto Patronum"
    description: >
      The Patronus Charm is an advanced defensive spell that conjures a
      positive energy force, often taking the form of an animal that
      represents the caster's spirit. It is primarily used to repel
      Dementors, creatures that feed on human happiness.
      Only those who can summon deeply positive memories can successfully
      cast a Patronus.
```

This gives you the best of both worlds:

1. In your YAML config, you can break the string up among multiple lines to make the string more readable (no horizontal scrolling). 
2. When your app reads the YAML file, it will replace the line breaks with whitespace, recreating the long string for use in the app logic. 

Here's a snippet of how python would interpret the yaml config file:

```python
import yaml
with open(f"./config_longstring.yaml", "r") as f:
  config_yaml = yaml.safe_load(f)

config_yaml
# config file interpreted as python dictionary: 
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

BUT if you want to preserve line breaks, you can use the pipe operator (`|`): 

```yaml
# file: config_longstring.yaml
spells:
  patronus_charm:
    incantation: "Expecto Patronum"
    description: |
      The Patronus Charm is an advanced defensive spell that conjures a
      positive energy force, often taking the form of an animal that
      represents the caster's spirit. It is primarily used to repel
      Dementors, creatures that feed on human happiness.
      Only those who can summon deeply positive memories can successfully
      cast a Patronus.
```

The YAML parser will read the strong block literally and respect line breaks. Note how the line breaks are identified by the new line character (`\n`) when loading the YAML file:

```python
with open(f"./config_longstring.yaml", "r") as f:
  config_yaml = yaml.safe_load(f)

config_yaml
# config file interpreted as python dictionary: 
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

This gives you options. You have more control about how the file is arranged for readability and how the app will interpret the file. 

## Comments
Want to use comments in your JSON config so you know what each part means? 

Too bad. You can't.

But you can with YAML: 

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

Comments show other developers a setting's possible values and draws attention to important settings. 

## Re-Use Code
Do you like repeating yourself? 

<div class="flex flex-col md:flex-row md:space-x-2 md:gap-3 py-2 items-stretch">
<div class="w-full md:w-1/2">

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
<div class="w-full md:w-1/2">

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

YAML allows you to reuse a node or part of the YAML file somewhere else. You first "anchor" the node and give it an alias with the `&` character. Later you reference that alias with the `*` character. The example above shows how we can reuse log settings across our services, enabling consistency.

If you want to get more complex, you can merge an aliased node into another node. That's what's happening above when we define database settings. We define the `default_database` node with common settings for both the primary and replica databases; then we merge that into both the primary and replica settings using the `<<` operator. Within the primary and replica settings, we define the settings that are unique to each environment (`name` and `read_only`). 

Beyond removing the annoyance of repeating yourself, YAML's anchoring and aliasing prevents future bugs from updates due to changes being made to one part of the config but not in a similar area elsewhere. 

---

I can go on and on about my love, but I think you get it. 

The YAML format is relatively new but frequently used. It's used in docker-compose files, github actions workflow setups, dbt configuration, and Kubernetes configuration. 

The `PyYAML` package can be used to work with YAML files. 

If you're a nerd like me, you can read the YAML spec (i.e. manual) at [yaml.org](https://yaml.org/spec/1.2.2/)

JSON's got its strengths. It's a long-time industry standard for communicating between services. Most programming languages provide ways to interact with JSON out-of-the-box. I'll still use JSON. 

But where possible, YAML is going to make an appearance. 

Making choices is hard. Call me if you need a listening ear. 

