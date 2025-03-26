Title: YAML vs JSON Config Files
Date: 2025-04-01
Slug: yaml-vs-config-config-files
Tags: system-design
Summary: All apps have config files. But should you use YAML or JSON? (Please don't say XML)
Status: draft

Confession: I'm cheating on my first love. 

JSON's been great. She's always there for me. I tell her my deepest secrets and she keeps them safe. She's dependable and helps me talk to others. 

But my recent fling with YAML has me wondering: Is there someone better? Someone out there who just gets me better than JSON does? 

Lately, I've fallen in love with YAML. Yes, she makes my config files more readable. But she has other features that make my life easier. 

## What are you talking about, weirdo
All apps have configuration. This is typically a file that stores the app settings, allowing you to make a few tweaks without digging into the code base. 

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

But these two beauties are different. Today we'll explore the differences and why YAML is my new main squeeze. 

## Cleaner Format
Readability is important. Code is written for machines, but we feeble humans need to an easy way to read that code, too. 

Take a look at the two examples above again. Notice what's missing from the YAML version? 

- No quotes
- No braces (`{}`)
- No commas

YAML's already looking easy on the eyes. &#128525;


- string blocks

[insert long string block example]


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

Adding comments to your config can help others understand the importance of each setting and what recommended settings may be. 

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

YAML allows you to reuse a certain "node" or part of the YAML file somewhere else. You first "anchor" the node and give it an alias with the `&` character. Later you can reference that alias with the `*` character. 

If you want to get more complicated, you can even merge an aliased node into a new node. There's what's happening above when we define a `default_database` node and then merge it that into both the primary and replica settings using the `<<` operator. 

## Use in Python
The `PyYAML` package can be used to work with YAML files. 

## In the wild
The YAML format is relatively new but frequently used. It's used in docker-compose files, github actions workflow setups, dbt configuration, and Kubernetes configuration. 

---

JSON's got its strengths. It's a long-time industry standard for communicating between services. Most programming languages provide ways to interact with JSON out-of-the-box. I'll still use JSON. 

But where possible, YAML is going to make an appearance. 

Making choices is hard. Call me if you need a listening ear. 


On a high-level both JSON and YAML are built upon a key-value pattern. 
