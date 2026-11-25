Title: Snowflake Lateral Flatten
Date: 2026-10-25
Slug: snowflake-lateral-flatten
Tags: snowflake, sql, data-engineering
Summary: What does the esoteric "lateral flatten" do in Snowflake? Unlock the mystery to wrangle those objects and arrays.
Status: published
MetaImage: /static/images/post029/snowflake_lateral_flatten_thumbnail.jpg


Snowflake makes data work easy.

Until you find a query like this:

```sql
select * from 
some_table t,
lateral flatten(t.some_array)
```

Then you question your SQL skills and all the career decisions you've made. 😱

This "lateral flatten" business confused me. Until I meditated upon the docs and achieved Snowflake nirvana. 😌

Today, we'll decipher what the "lateral flatten" syntax means. Soon you'll be wrangling nested data like a SQL guru.

## What does it do?

Here's a `students` table with object and array data types:


```text
 > select id, name, wand, courses from students;
+----------------------------------------------------------------------------------------------+
| ID | NAME             | WAND                            | COURSES                            |
|----+------------------+---------------------------------+------------------------------------|
| 1  | Harry Potter     | {                               | [                                  |
|    |                  |   "core": "Phoenix Feather",    |   "Defense Against the Dark Arts", |
|    |                  |   "length": 11,                 |   "Charms"                         |
|    |                  |   "wood": "Holly"               | ]                                  |
|    |                  | }                               |                                    |
| 2  | Hermione Granger | {                               | [                                  |
|    |                  |   "core": "Dragon Heartstring", |   "Arithmancy",                    |
|    |                  |   "length": 10.75,              |   "Transfiguration",               |
|    |                  |   "wood": "Vine"                |   "Charms"                         |
|    |                  | }                               | ]                                  |
| 3  | Draco Malfoy     | {                               | [                                  |
|    |                  |   "core": "Unicorn Hair",       |   "Potions"                        |
|    |                  |   "length": 10,                 | ]                                  |
|    |                  |   "wood": "Hawthorn"            |                                    |
|    |                  | }                               |                                    |
+----------------------------------------------------------------------------------------------+
```

The `wand` column contains objects (think JSON objects) while the `courses` column is an array of strings. 

Sometimes you need the items of an object or array on separate rows. That's where "lateral flatten" comes in.

Here's how to get the courses on separate rows:

```sql
select s.id, s.name, c.value::string as course
from students as s,
lateral flatten(s.courses) as c;
```

```text
+-------------------------------------------------------+
| ID | NAME             | COURSE                        |
|----+------------------+-------------------------------|
| 1  | Harry Potter     | Defense Against the Dark Arts |
| 1  | Harry Potter     | Charms                        |
| 2  | Hermione Granger | Arithmancy                    |
| 2  | Hermione Granger | Transfiguration               |
| 2  | Hermione Granger | Charms                        |
| 3  | Draco Malfoy     | Potions                       |
+-------------------------------------------------------+
```

The `courses` array is "exploded" into multiple rows. Each student is duplicated for as many values in their `courses` array.

The query syntax is a bit unusual, but we'll talk more about that later.

Other times, you want to extract specific pieces of an object data type. Here's how to get the characteristics each student's wand:

```sql
select s.id, s.name, w.key, w.value::string as value
from students as s,
lateral flatten(s.wand) as w;
```

```text
+-----------------------------------------------------+
| ID | NAME             | KEY    | VALUE              |
|----+------------------+--------+--------------------|
| 1  | Harry Potter     | core   | Phoenix Feather    |
| 1  | Harry Potter     | length | 11                 |
| 1  | Harry Potter     | wood   | Holly              |
| 2  | Hermione Granger | core   | Dragon Heartstring |
| 2  | Hermione Granger | length | 10.75              |
| 2  | Hermione Granger | wood   | Vine               |
| 3  | Draco Malfoy     | core   | Unicorn Hair       |
| 3  | Draco Malfoy     | length | 10                 |
| 3  | Draco Malfoy     | wood   | Hawthorn           |
+-----------------------------------------------------+
```

This time the key-value pairs of the `wand` object are expanded so that each key-value pair appears on one row.

That's it. The "lateral flatten" combo is used with data types that store multiple values (e.g. objects or arrays). "Lateral flatten" expands nested data or extracts a specific element.

`lateral` and `flatten` are two separate lego pieces in Snowflake. The natural question is "What exactly do `lateral` and `flatten` do individually?"

## Flatten

Flatten is poorly named. Rather than making things smaller (i.e. flattening them), `flatten` "explodes" values into multiple rows.

In short, `flatten` takes multiple values in a single "cell" and expands them into a relational representation. Again, `flatten` operates on data types like object, array, or variant.

Here's a sample array that's been flattened:

```sql
select *
from table(
  flatten(input => parse_json('["Harry", "Hermione"]'))
);
```

```text
+-------------------------------------------------------+
| SEQ | KEY  | PATH | INDEX | VALUE      | THIS         |
|-----+------+------+-------+------------+--------------|
| 1   | null | [0]  | 0     | "Harry"    | [            |
|     |      |      |       |            |   "Harry",   |
|     |      |      |       |            |   "Hermione" |
|     |      |      |       |            | ]            |
| 1   | null | [1]  | 1     | "Hermione" | [            |
|     |      |      |       |            |   "Harry",   |
|     |      |      |       |            |   "Hermione" |
|     |      |      |       |            | ]            |
+-------------------------------------------------------+
```

The array is built on-the-fly with `parse_json` and contains two elements: `["Harry", "Hermione"]`.

Here, `select *` queries all columns generated by the `flatten` function. Look at the output. For each array or object, `flatten` creates a "mini table" with 6 columns. When expanding the `courses` array earlier, you selected the `value` column. But there's so much more:

1. `seq`: A unique number identifying the original input row
    - For this example, there's only one input row, so `seq = 1` for all output rows.
2. `key`: The key of the object element (for objects only)
    - This example flattens an array, so all `key` values are `null`.
3. `path`: The path to the element within the input
4. `index`: The index of the array element (for arrays only)
5. `value`: The actual value of the element
6. `this`: The object or array being flattened

Unsurprisingly, `key` is only populated when flattening an **object**, and `index` is only populated when flattening an **array**. `this` highlights the source of a given row's value, which can be helpful when debugging.

Now here's a sample flattened object:

```sql
select *
from table(
  flatten(input => parse_json('{"core": "Phoenix Feather", "length": 11}'))
);
```

```text
+----------------------------------------------------------------------------------+
| SEQ | KEY    | PATH   | INDEX | VALUE             | THIS                         |
|-----+--------+--------+-------+-------------------+------------------------------|
| 1   | core   | core   | null  | "Phoenix Feather" | {                            |
|     |        |        |       |                   |   "core": "Phoenix Feather", |
|     |        |        |       |                   |   "length": 11               |
|     |        |        |       |                   | }                            |
| 1   | length | length | null  | 11                | {                            |
|     |        |        |       |                   |   "core": "Phoenix Feather", |
|     |        |        |       |                   |   "length": 11               |
|     |        |        |       |                   | }                            |
+----------------------------------------------------------------------------------+
```

This time, the `index` is consistently `null` since you're flattening an object, not an array. The `key` column is populated to show the key-value pairs within the object.

One more note about these queries: To stand alone in the `from` clause, `flatten` needs to be wrapped in `table()`. That's because `flatten` is a table function that returns a set of rows. The `table()` function converts that set of rows into a query-able table that `from` recognizes.

## Lateral

So what does the `lateral` keyword do?  When placed in a `from` clause, `lateral` provides an inline view that can reference columns in the preceding table expression. That's a lot of words. Let's try some examples.

First, here's another table `houses` that's related to the `students` table:

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

```text
> select * from houses;
+---------------------------------------------------+
| ID | HOUSE_NAME | PRIMARY_COLOR | SECONDARY_COLOR |
|----+------------+---------------+-----------------|
| 1  | Gryffindor | Red           | Gold            |
| 2  | Hufflepuff | Yellow        | Black           |
| 3  | Ravenclaw  | Blue          | Bronze          |
| 4  | Slytherin  | Green         | Silver          |
+---------------------------------------------------+
```

</div>

<div class="hidden md:block w-px bg-gray-300"></div>

<div markdown=1 class="w-full md:w-[48%]">

```text
> select id, name, house_id from students;
+----------------------------------+
| ID | NAME             | HOUSE_ID |
|----+------------------+----------|
| 1  | Harry Potter     | 1        |
| 2  | Hermione Granger | 1        |
| 3  | Draco Malfoy     | 4        |
+----------------------------------+
```

</div>
</div>

Here's how `lateral` is used to look up house info for each student:

```sql
select s.id, s.name, h2.*
from students s, lateral(select * from houses h where h.id = s.house_id) h2;
```

```text
+-----------------------------------------------------------------------------+
| ID | NAME             | ID_2 | HOUSE_NAME | PRIMARY_COLOR | SECONDARY_COLOR |
|----+------------------+------+------------+---------------+-----------------|
| 1  | Harry Potter     | 1    | Gryffindor | Red           | Gold            |
| 2  | Hermione Granger | 1    | Gryffindor | Red           | Gold            |
| 3  | Draco Malfoy     | 4    | Slytherin  | Green         | Silver          |
+-----------------------------------------------------------------------------+
```

`lateral` acts like a [correlated subquery](https://en.wikipedia.org/wiki/Correlated_subquery). The expression within `lateral` (i.e. the "inline view") is able to access the table on the left-hand-side. Specifically, the inline view is `select * from houses h where h.id = s.house_id`. The inline view explicitly references the `houses` table, but it also has access to the `students` table (aliased as `s`).

When processing a `lateral` join, the Snowflake engine behaves a bit like a for-loop:

```text
for each row on the left-hand-side:
    run the inline query using values from the current left-hand-side row
```

But while a correlated subquery can return only one row and one column, `lateral` can return multiple rows with multiple columns. Here `lateral` gives access to all 4 columns in `houses`: `id`, `house_name`, `primary_color`, and `secondary_color`.

This example is a bit contrived. The output can be generated with a traditional join as an alternative, so `lateral` is optional in this query.

But there are situations where `lateral` is required. You'd use `lateral` when chaining table functions (e.g. `flatten`) on nested data or when calling table functions requiring table-specific arguments.

Which leads to more advanced use cases...

## Lateral Flatten Again

Let's put it all together. `lateral` lets an expression read values from the previous expression. `flatten` extracts or expands values in an object or array. Together, `lateral flatten` allows you to extract or expand values AND keep a link to the original row.

Remember the query earlier? Let's look again:

```sql
select s.id, s.name, c.value::string as course
from students as s,
lateral flatten(s.courses) as c;
```

```text
+-------------------------------------------------------+
| ID | NAME             | COURSE                        |
|----+------------------+-------------------------------|
| 1  | Harry Potter     | Defense Against the Dark Arts |
| 1  | Harry Potter     | Charms                        |
| 2  | Hermione Granger | Arithmancy                    |
| 2  | Hermione Granger | Transfiguration               |
| 2  | Hermione Granger | Charms                        |
| 3  | Draco Malfoy     | Potions                       |
+-------------------------------------------------------+
```

There are two tables in play:

1. The first table is `students` (aliased as `s`).
2. The second table is given by `flatten(s.courses)` and aliased as `c`. This is the inline view created by `lateral`.

The first table's `courses` column serves as the input to `flatten`, meaning the `courses` array will be expanded. And the `select` clause includes the value output from `flatten` (`c.value`). Collectively, this relates individual courses to the original row the course comes from.


## Advanced Use of Lateral/Flatten

You made it, Padawan. Let's go deeper.

The new table `students_nested` has layers of objects and arrays in the `courses` column:


```text
 > select * from students_nested;
+-------------------------------------------------------------------------------+
| ID | NAME             | COURSES                                               |
|----+------------------+-------------------------------------------------------|
| 1  | Harry Potter     | [                                                     |
|    |                  |   {                                                   |
|    |                  |     "assignments": [                                  |
|    |                  |       "Read chapter on Boggarts",                     |
|    |                  |       "Write essay on werewolves"                     |
|    |                  |     ],                                                |
|    |                  |     "name": "Defense Against the Dark Arts"           |
|    |                  |   },                                                  |
|    |                  |   {                                                   |
|    |                  |     "assignments": [                                  |
|    |                  |       "Write essay on moonstone use in potion-making" |
|    |                  |     ],                                                |
|    |                  |     "name": "Potions"                                 |
|    |                  |   }                                                   |
|    |                  | ]                                                     |
| 2  | Hermione Granger | [                                                     |
|    |                  |   {                                                   |
|    |                  |     "assignments": [                                  |
|    |                  |       "Update number chart",                          |
|    |                  |       "Read textbook chapter 9"                       |
|    |                  |     ],                                                |
|    |                  |     "name": "Arithmancy"                              |
|    |                  |   }                                                   |
|    |                  | ]                                                     |
+-------------------------------------------------------------------------------+
```

Each row's `courses` value is an array of objects. Each object has two keys: `name` and `assignments`. And the `assignments` key maps to yet another array. 😰

It's not unusual to see semi-structured data like this, especially when dealing with API output. But for analytics, it's nice to have the data in unnested format. Let's get each student's assignment into a familiar relational layout. We'll build the query iteratively.

First, you expand the `courses` array to get each object on a separate row:

```text
 > select id, name, f1.value as course
   from students_nested s,
   lateral flatten(s.courses) f1;
+-----------------------------------------------------------------------------+
| ID | NAME             | COURSE                                              |
|----+------------------+-----------------------------------------------------|
| 1  | Harry Potter     | {                                                   |
|    |                  |   "assignments": [                                  |
|    |                  |     "Read chapter on Boggarts",                     |
|    |                  |     "Write essay on werewolves"                     |
|    |                  |   ],                                                |
|    |                  |   "name": "Defense Against the Dark Arts"           |
|    |                  | }                                                   |
| 1  | Harry Potter     | {                                                   |
|    |                  |   "assignments": [                                  |
|    |                  |     "Write essay on moonstone use in potion-making" |
|    |                  |   ],                                                |
|    |                  |   "name": "Potions"                                 |
|    |                  | }                                                   |
| 2  | Hermione Granger | {                                                   |
|    |                  |   "assignments": [                                  |
|    |                  |     "Update number chart",                          |
|    |                  |     "Read textbook chapter 9"                       |
|    |                  |   ],                                                |
|    |                  |   "name": "Arithmancy"                              |
|    |                  | }                                                   |
+-----------------------------------------------------------------------------+
```

Not bad. Now let's pull out the course name. To extract a value from an object, use colon notation (`:`). The expression `f1.value:name` pulls the value associated with the key of `name` for each object.

```text
 > select id, name, f1.value:name::string as course
   from students_nested s,
   lateral flatten(s.courses) f1;
+-------------------------------------------------------+
| ID | NAME             | COURSE                        |
|----+------------------+-------------------------------|
| 1  | Harry Potter     | Defense Against the Dark Arts |
| 1  | Harry Potter     | Potions                       |
| 2  | Hermione Granger | Arithmancy                    |
+-------------------------------------------------------+
```

This is looking good. Now to extract the assignments. You could try colon notation again to get assignments (`f1.value:assignments`)...

```text
 > select
     id,
     name,
     f1.value:name::string as course,
     f1.value:assignments as assignment
   from students_nested s,
   lateral flatten(s.courses) f1;
+-----------------------------------------------------------------------------------------------------------+
| ID | NAME             | COURSE                        | ASSIGNMENT                                        |
|----+------------------+-------------------------------+---------------------------------------------------|
| 1  | Harry Potter     | Defense Against the Dark Arts | [                                                 |
|    |                  |                               |   "Read chapter on Boggarts",                     |
|    |                  |                               |   "Write essay on werewolves"                     |
|    |                  |                               | ]                                                 |
| 1  | Harry Potter     | Potions                       | [                                                 |
|    |                  |                               |   "Write essay on moonstone use in potion-making" |
|    |                  |                               | ]                                                 |
| 2  | Hermione Granger | Arithmancy                    | [                                                 |
|    |                  |                               |   "Update number chart",                          |
|    |                  |                               |   "Read textbook chapter 9"                       |
|    |                  |                               | ]                                                 |
+-----------------------------------------------------------------------------------------------------------+
```

But this gives an array of assignments for each row. If only there was a way to expand the assignments array. 😏

You guessed it. You need another `lateral flatten`.

Here's the final query in all its glory. Just look at those chained `lateral flatten` calls:

```text
 > select
     id,
     name,
     f1.value:name::string course,
     f2.value::string assignment
   from students_nested s,
   lateral flatten(s.courses) f1,
   lateral flatten(f1.value:assignments) f2;
+-------------------------------------------------------------------------------------------------------+
| ID | NAME             | COURSE                        | ASSIGNMENT                                    |
|----+------------------+-------------------------------+-----------------------------------------------|
| 1  | Harry Potter     | Defense Against the Dark Arts | Read chapter on Boggarts                      |
| 1  | Harry Potter     | Defense Against the Dark Arts | Write essay on werewolves                     |
| 1  | Harry Potter     | Potions                       | Write essay on moonstone use in potion-making |
| 2  | Hermione Granger | Arithmancy                    | Update number chart                           |
| 2  | Hermione Granger | Arithmancy                    | Read textbook chapter 9                       |
+-------------------------------------------------------------------------------------------------------+
```

This time, the first `flatten` inline view (`f1`) is passed as an input to the 2nd `flatten` call. Specifically, `f1`'s assignment array is accessed via `f1.value:assignments`. 

The 2nd flatten inline view is aliased as `f2` and represents the expansion of the `assignments` array. Listing `f2.value` in the `select` clause pulls each assignment into the output.

---

Wowza, that was a lot! But this shows the power of SQL. Each function and keyword is a lego piece. What you build depends on your creativity to put the pieces together.

Remember: `lateral flatten` unpacks nested data into separate rows and joins those new rows back to the source row. Read the Snowflake docs on [lateral](https://docs.snowflake.com/en/sql-reference/constructs/join-lateral) and [flatten](https://docs.snowflake.com/en/sql-reference/functions/flatten) for more features and ideas.

Are you scratching your head over another unusual SQL pattern? Don't hesitate to reach out for a [guide](https://kpdata.dev/).
