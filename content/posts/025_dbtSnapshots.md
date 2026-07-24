Title: dbt Snapshots
Date: 2026-07-24
Slug: dbt-snapshots
Tags: dbt, data-engineering
Summary: Did you mess up that Slowly Change Dimension Type 2 again? dbt snapshots make it easier by implement SCDs for you.
Status: draft


Things change.

That's a good thing... Until you need to know what things were like before.

In the data world, changes to tables are often managed by Slowly Changing Dimensions.


Slowly Changing Dimension Type 2 tables are a common way to track changes to data tables. What's that you ask? SCD Type II tables track changes to records. The basic idea is that each row has an effective begin date and end date. "Current" records have a NULL end date or some fake high end date like 9999-12-31. When the record updates, the previous records has its end date updated to something like today, and a new record is inserted with an effective date that matches the previous record's end date.

All this is montonous to implement by yourself. And there's a high risk of error. Which is why dbt Snapshots are helpful.

dbt Snapshots are dbt's way of handling Slowly Changing Dimension Type 2 tables.

## Basics 

It goes like this: First, you pick a source table to keep track off. Then when you run `dbt snapshot`, dbt will generate a snapshot table with SCD Type 2 columns. Each time you run the snapshot command, dbt will compare the source and snapshot tables. Any new rows will be added. Any modified rows will be reflected in the table. That's it!

Well, there's a bit more set up you need. 😅

You need to figure out HOW to determine if records in the source table have changed. There are two strategies: "timestamp" and "check".

The easiest way is to use a timestamp based approach. Ideally, the source table has some kind of timestamp column indicating when the row was updated. Such a column can be used to determine if a given records in the snapshot is stale and out of date with the source table. Of course, the question arises, how do I match rows from the snapshot with rows from the source table. THat's where the unique_id comes in; the unique_id is some combination of columns in the source table that can be used to identify a single row in the table. With a timestamp based snapshot, dbt compares the rows by unique-id and compares the updated timestamp field. If the snapshot's update for a given unique_id is older than the source table's for the same row... the row is updated in the snapshot and a new row is generated.

Alternatively, a column based approach is available in dbt Snapshots. With this approach, you declare which columns you want to keep track of. Only if changes to these columns occur does dbt snapshot generate a new row in the snapshot table. This approach is more fragile, especially if the schema changes. A column in the watched columns may drop. Or a new column that you want to track may enter. Both would require an update to the snapshot configuration.

## Demo

Enough talk, let's set up a snapshot! We'll walk through a timestamp strategy.

First, here's our source table: `students`. I'll pretend in my Snowflake wonderland and using database `demo` and schema `core`.

| id  | name  | house      | last_updated |
| --- | ---   | ---        | ---          |
| 1   | Harry | Gryffindor | 2026-07-23   |
| 2   | Draco | Slytherin  | 2027-07-23   |

Nowadays, snapshots are configured in a yaml file. Enter the source table. Determine the strategy (timestamp or check). Add the unique_id. If you picked timestamp, declare the updated_at column. If you picked check, declare the columns to check.

```yaml
# snapshots/students_snapshot.yml
snapshots:
  - name: students_snapshot
    relation: source("core", "students")
    config:
      database: demo
      schema: snapshot
      strategy: timestamp
      unique_key: id
      updated_at: last_updated
```

What did we do here? 
 [ explain yaml file]

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
