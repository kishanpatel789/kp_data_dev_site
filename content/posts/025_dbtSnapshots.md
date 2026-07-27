Title: dbt Snapshots
Date: 2026-07-24
Slug: dbt-snapshots
Tags: dbt, data-engineering
Summary: Did you mess up that Slowly Change Dimension Type 2 again? dbt snapshots make it easier by implement SCDs for you.
Status: draft


Things change.

That's good... Until you need to see how things were before. 🤔

In the data world, changes are often tracked by [Slowly Changing Dimensions (SCDs)]({filename}/posts/019_SlowlyChangingDimensions.md).

It's simple: To update a table while preseving history, add two columns to mark the row's effective "begin date" and "end date." That gives a window for when each row is active. "Current" records have a NULL end date or some fake high end date like 9999-12-31. When a change occurs, dig through the table to find the previous record; update its "end date" to today. Then insert a new record with a "begin date" that perfectly matches the previous record's "end date." 🥴

Okay, so it's not simple. It's quite difficult to get SCDs right. 

Which is why dbt Snapshots are helpful.

Snapshots are dbt's implementation of Slowly Changing Dimension Type 2 tables. Give dbt a few details on what you want to track, and dbt will automagically handle the grunt work for you.

## Basics 

It goes like this: First, pick a source table to keep track of. Then when you run `dbt snapshot`, dbt generates a 2nd table (a "snapshot" table) with SCD Type 2 columns. Each time you run the snapshot command, dbt will compare the source and snapshot tables. New rows in the source will be added to the snapshot. Any modified rows will be reflected in the snapshot. That's it!

Well, there's a bit more set up you need. 😅

How does dbt know which rows in the snapshot map to a row from the source? That's where the `unique_key` comes in. The `unique_key` is some combination of columns in the source table that identifies a single row in the table. Think if `unique_key` as the primary key of the table. dbt will use the `unique_key` to play matchmaker: it will link rows in the snapshot to rows in the source table.

After rows are matched, how does dbt determine if the source row has changed? You get to decide by picking one of two strategies: **timestamp** and **check**.

The timestamp strategy is the easiest. Ideally, the source table has some kind of timestamp column indicating when the row was updated. This column is used to decide if a record in the snapshot is stale or out-of-date with the source table. If the source row's update timestamp is newer than the last time the snapshot ran, dbt will update the stale row in the snapshot and create a new snapshot row (if needed).

The check strategy works well for source tables that don't have a column marking the row's last update. dbt compares a list of columns between the snapshot and the source table. If any of these columns have changed, dbt updates the stale row in the snapshot and creates a new row. But if all columns in the source match the latest version in the snapshot, dbt does nothing.  This approach is more fragile, especially when the schema changes. A column in the list-of-columns-to-watch may drop. Or a new column that you want to track may enter the table. Both schema evolutions require an update to the snapshot configuration.

## Demo

Enough talk, let's set up a snapshot!

First, here's our source table: `students`. When a row changes, its value in the `last_updated` column updates to the current time.

| id  | name  | house      | last_updated |
| --- | ---   | ---        | ---          |
| 1   | Harry | Gryffindor | 2026-07-23   |
| 2   | Draco | Slytherin  | 2027-07-23   |

We'll play in a Snowflake wonderland, using database `demo` and schema `core` for this table.

Nowadays, snapshots are configured in a YAML file like this:

- Pick a name for the snapshot.
- Enter the source table.
- Add the `unique_id`.
- Determine the strategy (timestamp or check).
    - If you picked "timestamp," declare the `updated_at` column. 
    - If you picked "check," declare the columns to check in `check_cols`. 

Here's an example configuration using a timestamp strategy:

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

Here the `name` key stores the snapshot's name (`students_snapshot`). The `relation` key says the source table is the `students` table. The upstream source can be either a dbt `source` tag or a `ref` tag.

Then `config` node indicates the database and schema the snapshot should live in. Unsurprisingly the `unique_key` is `id`. And since the `strategy` is "timestamp," the `updated_at` key is set to `last_updated` (i.e. the column that represents when each row was last updated).

The YAML file can live in the `models` folder or the `snapshots` folder of the dbt project. But I'm a purist and like to keep my snapshots in `snapshots/` while my models live in `models/`. 😁 Here's where snapshots should go in a standard dbt project structure:

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

Putting it all together, our source table is `demo.core.students`, and we'll attempt to make a snapshot at `demo.snapshot.students_snapshot`. 

Time to pull the trigger!

![First dbt snapshot command](/static/images/post025/dbt_snapshot_001.png)

Running `dbt snapshot` creates the snapshot table for the first time. The [SUCCESS 2 in ...] note indicates that two rows were processed in the snapshot. Let's check out the source table and snapshot table. 

```text
 > select * from demo.core.students;
+------------------------------------------------------+
| ID | NAME  | HOUSE      | LAST_UPDATED               |
|----+-------+------------+----------------------------|
| 1  | Harry | Gryffindor | 2026-07-27 13:51:49.664000 |
| 2  | Draco | Slytherin  | 2026-07-27 13:51:49.664000 |
+------------------------------------------------------+

 > select * from demo.snapshot.students_snapshot;
+------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ID | NAME  | HOUSE      | LAST_UPDATED               | DBT_SCD_ID                       | DBT_UPDATED_AT             | DBT_VALID_FROM             | DBT_VALID_TO |
|----+-------+------------+----------------------------+----------------------------------+----------------------------+----------------------------+--------------|
| 1  | Harry | Gryffindor | 2026-07-27 13:51:49.664000 | ad3ce94017f7256b6fbd69df57d8d14d | 2026-07-27 13:51:49.664000 | 2026-07-27 13:51:49.664000 | NULL         |
| 2  | Draco | Slytherin  | 2026-07-27 13:51:49.664000 | d63c4b0fb88358b0cac8de4f0a3edbf2 | 2026-07-27 13:51:49.664000 | 2026-07-27 13:51:49.664000 | NULL         |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

Notice that the snapshot has the same columns as the source table plus new meta columns. 👀

- `dbt_valid_from`: indicates the record starts being active.
- `dbt_valid_to`: indicates when the record stops being active. Right now, all rows have a NULL `dbt_valid_to`, meaning all rows are active.
- `dbt_scd_id`: used internally by dbt when updating snapshots. `dbt_scd_id` is a combination of the `unique_key` and a timestamp of when the row was updated. Its values look funny because it's a hash of the the concatenation. The scd_id is used to determine which rows need to be updated when dbt snapshot runs.
- `dbt_updated_at`: says when the row was modified or inserted into the source table.

Neat! Now let's change our source table and see how the snapshot updates. We'll add a row, modify a row, and delete a row.

### Add a New Row

Let's add our favorite witch to the party: 

```sql
insert into students values
(3, 'Hermione', 'Gryffindor', current_timestamp());
```

Then we re-run our snapshot. Remember, dbt will attempt to find any new rows or any modified rows in the source:

![dbt snapshot command after adding row](/static/images/post025/dbt_snapshot_002_add.png)

This time we see 1 row is impacted in the snapshot. This makes sense because you added one row and modified no existing rows. Let's check the source and snapshot tables again:

```text
 > select * from demo.core.students;
+---------------------------------------------------------+
| ID | NAME     | HOUSE      | LAST_UPDATED               |
|----+----------+------------+----------------------------|
| 1  | Harry    | Gryffindor | 2026-07-27 13:51:49.664000 |
| 2  | Draco    | Slytherin  | 2026-07-27 13:51:49.664000 |
| 3  | Hermione | Gryffindor | 2026-07-27 14:28:11.968000 |
+---------------------------------------------------------+

 > select * from demo.snapshot.students_snapshot
   order by id, dbt_valid_from;
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ID | NAME     | HOUSE      | LAST_UPDATED               | DBT_SCD_ID                       | DBT_UPDATED_AT             | DBT_VALID_FROM             | DBT_VALID_TO |
|----+----------+------------+----------------------------+----------------------------------+----------------------------+----------------------------+--------------|
| 1  | Harry    | Gryffindor | 2026-07-27 13:51:49.664000 | ad3ce94017f7256b6fbd69df57d8d14d | 2026-07-27 13:51:49.664000 | 2026-07-27 13:51:49.664000 | NULL         |
| 2  | Draco    | Slytherin  | 2026-07-27 13:51:49.664000 | d63c4b0fb88358b0cac8de4f0a3edbf2 | 2026-07-27 13:51:49.664000 | 2026-07-27 13:51:49.664000 | NULL         |
| 3  | Hermione | Gryffindor | 2026-07-27 14:28:11.968000 | dbbe1163134d722b88104dab95da1689 | 2026-07-27 14:28:11.968000 | 2026-07-27 14:28:11.968000 | NULL         |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

Seems fairly straight forward... the record was added to the snapshot.

### Modify a Row

Now, let's make things more interesting. We'll modify a row in the source and re-snapshot the table.

```sql
update students
set name = 'HARRY', last_updated = current_timestamp()
where id = 1;
```

Here we target row with `id = 1` and update the `name` to be uppercase. Of course, we update the `last-updated` column to tell the reader when this row was updated.

Running `dbt snapshot` again will show that 1 row was updated:

```bash
> dbt snapshot
...
21:39:01  1 of 1 START snapshot snapshot.students_snapshot ............................... [RUN]
21:39:06  1 of 1 OK snapshotted snapshot.students_snapshot ............................... [SUCCESS 1 in 4.68s]
21:39:06
21:39:06  Finished running 1 snapshot in 0 hours 0 minutes and 6.28 seconds (6.28s).
21:39:06
21:39:06  Completed successfully
21:39:06
21:39:06  Done. PASS=1 WARN=0 ERROR=0 SKIP=0 NO-OP=0 REUSED=0 TOTAL=1
```

Drumroll please...

```text
 > select * from demo.core.students;
+---------------------------------------------------------+
| ID | NAME     | HOUSE      | LAST_UPDATED               |
|----+----------+------------+----------------------------|
| 1  | HARRY    | Gryffindor | 2026-07-27 14:37:14.920000 |
| 2  | Draco    | Slytherin  | 2026-07-27 13:51:49.664000 |
| 3  | Hermione | Gryffindor | 2026-07-27 14:28:11.968000 |
+---------------------------------------------------------+

 > select * from demo.snapshot.students_snapshot
   order by id, dbt_valid_from;
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ID | NAME     | HOUSE      | LAST_UPDATED               | DBT_SCD_ID                       | DBT_UPDATED_AT             | DBT_VALID_FROM             | DBT_VALID_TO               |
|----+----------+------------+----------------------------+----------------------------------+----------------------------+----------------------------+----------------------------|
| 1  | Harry    | Gryffindor | 2026-07-27 13:51:49.664000 | ad3ce94017f7256b6fbd69df57d8d14d | 2026-07-27 13:51:49.664000 | 2026-07-27 13:51:49.664000 | 2026-07-27 14:37:14.920000 |
| 1  | HARRY    | Gryffindor | 2026-07-27 14:37:14.920000 | 58150a63e572754a63c204d2f1d020d4 | 2026-07-27 14:37:14.920000 | 2026-07-27 14:37:14.920000 | NULL                       |
| 2  | Draco    | Slytherin  | 2026-07-27 13:51:49.664000 | d63c4b0fb88358b0cac8de4f0a3edbf2 | 2026-07-27 13:51:49.664000 | 2026-07-27 13:51:49.664000 | NULL                       |
| 3  | Hermione | Gryffindor | 2026-07-27 14:28:11.968000 | dbbe1163134d722b88104dab95da1689 | 2026-07-27 14:28:11.968000 | 2026-07-27 14:28:11.968000 | NULL                       |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

WHOA! Now the snapshot has 2 versions of Harry's row. Check out how the `dbt_valid_from` and `dbt_valid_to` values dance together for the 1st two rows. The first record is active from 13:51 to 14:37. The second row becomes active at the same time the 1st record became invalid. This is a functioning SCD Type 2 table!

### Delete a Row

Let's remove Draco from the source (`id = 2`).

```sql
delete from students
where id = 2;
```


Interestingly, another `dbt snapshot` call shows 0 rows were updated. 

```bash
> dbt snapshot
...
21:43:57  1 of 1 START snapshot snapshot.students_snapshot ............................... [RUN]
21:44:00  1 of 1 OK snapshotted snapshot.students_snapshot ............................... [SUCCESS 0 in 3.61s]
21:44:01
21:44:01  Finished running 1 snapshot in 0 hours 0 minutes and 5.12 seconds (5.12s).
21:44:01
21:44:01  Completed successfully
21:44:01
21:44:01  Done. PASS=1 WARN=0 ERROR=0 SKIP=0 NO-OP=0 REUSED=0 TOTAL=1
```

And if we check the source and snapshot again, we see the record WAS removed from the source but the snapshot doesn't reflect that. 🫢

```text
 > select * from demo.core.students;
+---------------------------------------------------------+
| ID | NAME     | HOUSE      | LAST_UPDATED               |
|----+----------+------------+----------------------------|
| 1  | HARRY    | Gryffindor | 2026-07-27 14:37:14.920000 |
| 3  | Hermione | Gryffindor | 2026-07-27 14:28:11.968000 |
+---------------------------------------------------------+

 > select * from demo.snapshot.students_snapshot
   order by id, dbt_valid_from;
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ID | NAME     | HOUSE      | LAST_UPDATED               | DBT_SCD_ID                       | DBT_UPDATED_AT             | DBT_VALID_FROM             | DBT_VALID_TO               |
|----+----------+------------+----------------------------+----------------------------------+----------------------------+----------------------------+----------------------------|
| 1  | Harry    | Gryffindor | 2026-07-27 13:51:49.664000 | ad3ce94017f7256b6fbd69df57d8d14d | 2026-07-27 13:51:49.664000 | 2026-07-27 13:51:49.664000 | 2026-07-27 14:37:14.920000 |
| 1  | HARRY    | Gryffindor | 2026-07-27 14:37:14.920000 | 58150a63e572754a63c204d2f1d020d4 | 2026-07-27 14:37:14.920000 | 2026-07-27 14:37:14.920000 | NULL                       |
| 2  | Draco    | Slytherin  | 2026-07-27 13:51:49.664000 | d63c4b0fb88358b0cac8de4f0a3edbf2 | 2026-07-27 13:51:49.664000 | 2026-07-27 13:51:49.664000 | NULL                       |
| 3  | Hermione | Gryffindor | 2026-07-27 14:28:11.968000 | dbbe1163134d722b88104dab95da1689 | 2026-07-27 14:28:11.968000 | 2026-07-27 14:28:11.968000 | NULL                       |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

What happened!? By default, if a row is deleted from the source table, dbt won't do anything to the corresponding record in the snapshot. That may not be ideal as the record would still show as "current". Use the `hard_delete` parameter to change things. `invalidate` will update the dbt_end_date to whenever the snapshot was built. This still isn't ideal but it doesn't show the datetime when the record actually dropped out of the source table, but it's better than nothing.

PICK UP: add hard_delete parameter and show what happens when you delete a record again

[ demo column approach in snowflake - maybe not do this part ]

Oops... someone ran a `dbt build --full-refresh`. And that full-refresh wiped out historic data in the snapshot. Game over right? No!
dbt protects snapshtos from a --full-refresh flag.

---

[ insert docs link ]
