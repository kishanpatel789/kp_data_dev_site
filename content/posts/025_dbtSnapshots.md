Title: dbt Snapshots
Date: 2026-07-24
Slug: dbt-snapshots
Tags: dbt, data-engineering
Summary: Did you mess up that Slowly Change Dimension Type 2 again? dbt snapshots make it easier by implement SCDs for you.
Status: draft


Things change.

That's good... Until you need to know what things were like before. 🤔

In the data world, changes are often tracked by [Slowly Changing Dimensions (SCDs)]({filename}/posts/019_SlowlyChangingDimensions.md).

It's simple: To update a table while preseving history, add two columns to mark the row's effective "begin date" and "end date." That gives a window for when each row is active. "Current" records have a NULL end date or some fake high end date like 9999-12-31. When a change occurs, dig through the table to find the previous record; update its "end date" to today. Then insert a new record with an "begin date" that perfectly matches the previous record's "end date." 🥴

Okay, so it's not simple. It's quite difficult to get right, and there's a high risk of messing up the SCD. 

Which is why dbt Snapshots are helpful.

Snapshots are dbt's implementation of Slowly Changing Dimension Type 2 tables. Give dbt a few details on what you want to track, and dbt will automagically handle the grunt work for you.

## Basics 

It goes like this: First, pick a source table to keep track of. Then when you run `dbt snapshot`, dbt will generate a snapshot table with SCD Type 2 columns. Each time you run the snapshot command, dbt will compare the source and snapshot tables. Any new rows will be added. Any modified rows will be reflected in the snapshot. That's it!

Well, there's a bit more set up you need. 😅

How does dbt know which rows in the snapshot are associated with a row from the table? That's where the `unique_key` comes in. The `unique_key` is some combination of columns in the source table that identifies a single row in the table. Think if `unique_key` as the primary key of the table. dbt will use the `unique_key` to play matchmaker: it will link rows in the snapshot to rows in the source table.

After rows are matched, how does dbt determine if the source row has changed? You get to decide by picking one of two strategies: **timestamp** and **check**.

The timestamp strategy is the easiest. Ideally, the source table has some kind of timestamp column indicating when the row was updated. This column is used to decide if a record in the snapshot is stale or out-of-date with the source table. If the source row's update timestamp is newer than the last time the snapshot ran, dbt will update the stale row in the snapshot and create a new snapshot row (if needed).

The check strategy works well for source tables that don't have a column marking the row's last update. dbt compares a list of columns between the snapshot and the source table. If any of these columns has changed, dbt updates the satle row in teh snapshot and creates a new row. But if all columns in the source match the latest version in the snapshot, dbt does nothing.  This approach is more fragile, especially if the schema changes. A column in the list-of-columns-to-watch may drop. Or a new column that you want to track may enter the table. Both schema evolutions require an update to the snapshot configuration.

## Demo

Enough talk, let's set up a snapshot!

First, here's our source table: `students`. We'll play in a Snowflake wonderland, using database `demo` and schema `core`.

| id  | name  | house      | last_updated |
| --- | ---   | ---        | ---          |
| 1   | Harry | Gryffindor | 2026-07-23   |
| 2   | Draco | Slytherin  | 2027-07-23   |

Nowadays, snapshots are configured in a yaml file. Enter the source table. Determine the strategy (timestamp or check). Add the `unique_id`. If you picked timestamp, declare the `updated_at` column. If you picked check, declare the columns to check in `check_cols`. Here's an example configuration using a timestamp strategy:

```yaml
# snapshots/students_snapshot.yml
snapshots:
  - name: students_snapshot
    relation: source("core", "students")
    config:
      database: demo
      schema: snapshot
      unique_key: id
      strategy: timestamp
      updated_at: last_updated
```

Declare name of the snapshot table with `name`. Declare the source table with `relation`; this can be either a `source` tag or a `ref` tag. Then within the `config` node, indicate the database and schema the snapshot should live in. Also give the required `unique_key` and `strategy`. Since the `strategy` is "timestamp," identify the name of the column that represents when each row is updated in source (`updated_at: last_updated`).

The YAML file can live in the `models` folder or the `snapshots` folder of the dbt project. 

```bash
.
├── analyses
├── dbt_project.yml
├── logs
├── macros
├── models
│   └── sources.yml
├── README.md
├── seeds
├── snapshots
│   └── students_snapshot.yml  # <--- put the YAML file in the snapshot folder if you're sane
└── tests
```


PICK UP: walk through 1st snapshot

[ create 1st snapshot and show snapshot table ]

[ demo timestamp approach in snowflake ]

You'll notice that the snapshot has the same columns as the source table plus new meta columns.

- dbt_valid_from 
- dbt_valid_to give the window for when the record is active.
- And dbt_scd_id is a has of the row used internally by dbt. It's a combination of the unique_id and a timestamp of when the row was updated. Its values look funny because it's a hash of the the concatenation. The scd_id is used to determine which rows need to be updated when dbt snapshot runs.
- dbt_updated_at: says when the row was inserted into the snapshot table

Alright, now let's change our source table. We'll add a row, modify a row, and delete a row.

[ add new row and snapshot again ]

[ modify harry's row and snapshot again ]

[ delete draco's row and snapshot again ]

By default, if a row is deleted from the source table, the dbt won't do anything to the corresponding record in the snapshot. That may not be ideal as the record would still show as "current". Use the `hard_delete` parameter to change things. `invalidate` will update the dbt_end_date to whenever the snapshot was built. This still isn't ideal but it doesn't show the datetime when the record actually dropped out of the source table, but it's better than nothing.

[ demo column approach in snowflake - maybe not do this part ]

Oops... someone ran a `dbt build --full-refresh`. And that full-refresh wiped out historic data in the snapshot. Game over right? No!
dbt protects snapshtos from a --full-refresh flag.
