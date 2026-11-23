Title: Snowflake Lateral Flatten
Date: 2026-10-24
Slug: snowflake-lateral-flatten
Tags: snowflake, data-engineering
Summary: What does the mysterious "lateral flatten" do in Snowflake? Unlock the mystery to wrangle those objects and arrays.
Status: draft


Snowflake makes data work easy.

Until you find a query like this:

```sql
select * from 
some_table t,
lateral flatten(t.some_array)
```

Then you wonder why you chose to use SQL in the first place.

This "lateral flatten" business confused me. Until I meditated upon the docs and achieved Snowflake nirvana.

Today, we'll decipher what the "lateral flatten" syntax means.

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

Sometimes you need the individual items in an object or array on a separate row. That's where "lateral flatten" comes in.

Here's how to get the courses on separate lines:

```sql
select s.id, s.name, c.value::string as course
from students as s,
lateral flatten(input => s.courses) as c;
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

Here the `courses` array is "exploded" into multiple rows. Each student is duplicated for as many values in their `courses` array.

The query syntax is a bit unusual, but we'll talk more about that later.

Other times, you want to extract specific pieces of an object data type. Here's how to get the characteristics each student's wand:

```sql
select s.id, s.name, w.key, w.value::string as value
from students as s,
lateral flatten(input => s.wand) as w;
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

That's what the "lateral flatten" combo is usually used for -- to expand or extract columns containing objects or arrays. 

`lateral` and `flatten` are two separate lego pieces in Snowflake. The natural question is "What exactly do `lateral` and `flatten` do individually?"

## Flatten

The `flatten` function works with data types that store multiple values (e.g. array, object, or variant). Flatten is poorly named. Rather than making things smaller (i.e. flattening them), `flatten` "explodes" values into multiple rows.

In short, `flatten` takes multiple values in a single "cell" and expands them into a relational representation.

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

Here, you query all columns generated by the `flatten` function (`select *`). Look at the output. For each array or object, `flatten` creates a "mini table" with 6 columns. Earlier, you selected the `value` column to get each element of the `courses` array. But there's so much more:

1. `seq`: A unique number identifying the original input row
    - For this example, there's only one input row, so `seq = 1` for all output rows.
2. `key`: The key of the object element (for objects only)
    - This example flattens an array, so all `key` values are `null`.
3. `path`: The path to the element within the input
4. `index`: The index of the array element (for arrays only)
5. `value`: The actual value of the element
6. `this`: The object or array being flattened

Unsurprisingly, `key` is only populated when flattening an object, and `index` is only populated when flattening an array. `this` is useful for recursion; more on that later.

And here's a flattened object:

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

One more note about the query: To stand alone in the `from` clause, `flatten` needs to be wrapped in `table()`. That's because `flatten` is a table function that returns a set of rows. The `table()` function converts that set of rows into a queryable table that `from` recognizes.

## Lateral

So what does the `lateral` keyword do?  When placed in a `from` clause, `lateral` provides an inline view that can reference columns in the preceding table expression. That's a lot of words. Let's try some examples.

First, here's another table `houses` that could be related to the `students` table:

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

Here's how `lateral` could be used to look up house info for each student:

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

`lateral` acts like a correlated subquery. The expression within `lateral` (i.e. the "inline view") is able to access the table on the left-hand-side. Specifically, the inline view is `select * from houses h where h.id = s.house_id`. The inline view explicitly references the `houses` table, but it also has access to the `students` student (aliased as `s`).

When processing a `lateral` join, the Snowflake engine executes something like a for loop:

```text
for each row on the left-hand-side:
    run the inline query using values from the current left-hand-side row
```

But while a subquery can return only one row and one column, `lateral` can return multiple rows with multiple columns. Here `lateral` gives access to two columns: `primary_color` and `secondary_color`.

This example is a bit contrived. The output can be generated with a traditional join as an alternative. Lateral is optional in this query.

But there are situations where `lateral` is required. You'd use `lateral` when chaining table functions (e.g. `flatten`) on nested data or when calling table functions requiring table-specific arguments.

Which leads to more advanced use cases...

## Lateral Flatten Again

Let's put it all together. Lateral lets an expression read values from the previous expression. Flatten is used to extract or expand values in an object or array. Together, `lateral flatten` allows you to extract or expand values while keeping a relation to the original row.

Remember the query earlier? Let's look again:

```sql
select s.id, s.name, c.value::string as course
from students as s,
lateral flatten(input => s.courses) as c;
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

There are two "tables" in play. The first table `students` is aliased as `s`. The second object is given by `lateral flatten(input => s.courses)` and is aliased as `c`. The first table's `courses` column serves as the input to `flatten`.

PICK UP HERE

## Advanced Uses of Lateral/Flatten


- build nested objects
  - stringing lateral flatten together
  - recursive input
- flatten inputs

The flatten function has 5 arguments with sensible defaults: input, path, outer, recursive, mode. In practice, `outer` is the parameter are the ones most common used. But if you're feelign adventurious, give `recursive` whirl


---

[ outro ]

[ add links to docs ]

I'm your guru. 
