Title: BigQuery Flavor of SQL
Date: 2024-09-12
Slug: bigquery-flavor-of-sql
Tags: sql, gcp, data-engineering
Summary: What are some of the unique features of BigQuery's GoogleSQL? Let's dive into some helpful syntax for day-to-day querying.  
Status: published

It comes in many flavors. 

Some old, some new. 

Some mainstream, some flat-out quirky. 

You know what I'm talking about: **SQL**. 

ANSI SQL, T-SQL, PL/SQL, MySQL, PostgreSQL, SQLite, SparkSQL, HiveQl, GoogleSQL, ... the list goes on.

SQL is a household name (at least among developers). The language has been around for decades, and new dialects come out every few years. The core of the language is the same, but each flavor has a unique spin on how we wrangle our relational tables. A few months ago, I took my first bite of BigQuery's SQL, called [GoogleSQL](https://cloud.google.com/bigquery/docs/introduction-sql). This flavor has some cool features to make your daily querying tasks easier. Let's check them out. 

## SELECT * EXCEPT
Picture this: You have a table with hundreds of columns. You're doubtful even 10% of them are being used, but hey you're not the decision-maker for this OneBigTable design. Let's say you need *most* of the columns for your query but not others. Ready to write out the hundreds of columns one-by-one? There has to be an easier (i.e. less painful) way.

BigQuery SQL offers [`SELECT * EXCEPT()`](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax#select_except). You can quickly capture the same columns by calling out the few columns you do NOT want. The two options below generate the same result. But one of them preserves your sanity. 

```sql
-- option 1: list the columns you want
SELECT 
	StudentID,
	FirstName,
	LastName,
	House,
	`Year`,
	DefenseAgainstTheDarkArts_Grade,
	Transfiguration_Grade,
	Charms_Grade,
	Potions_Grade,
	Herbology_Grade,
	Astronomy_Grade,
	HistoryOfMagic_Grade,
	CareOfMagicalCreatures_Grade,
	Divination_Grade,
	AncientRunes_Grade,
	Arithmancy_Grade,
	MuggleStudies_Grade,
	Flying_Grade,
	QuidditchParticipation,
	OWLs_DefenseAgainstTheDarkArts,
	OWLs_Transfiguration,
	OWLs_Charms,
	OWLs_Potions,
	OWLs_Herbology,
	OWLs_Astronomy,
	OWLs_HistoryOfMagic,
	OWLs_CareOfMagicalCreatures,
	OWLs_Divination,
	OWLs_AncientRunes,
	OWLs_Arithmancy,
	OWLs_MuggleStudies,
	NEWTs_DefenseAgainstTheDarkArts,
	NEWTs_Transfiguration,
	NEWTs_Charms,
	NEWTs_Potions,
	NEWTs_Herbology,
	NEWTs_Astronomy,
	NEWTs_HistoryOfMagic,
	NEWTs_CareOfMagicalCreatures,
	NEWTs_Divination,
	NEWTs_AncientRunes,
	NEWTs_Arithmancy,
	NEWTs_MuggleStudies,
	Attendance,
	Behavior,
	ExtraCredit,
	HousePoints,
	Detentions--,
	-- QuidditchTeam,
	-- Patronus
FROM HOGWARTS.GRADEBOOK;
```

```sql
-- option 2: list the columns you DO NOT want
SELECT * EXCEPT(
	QuidditchTeam,
	Patronus
)
FROM HOGWARTS.GRADEBOOK;
```

Using `SELECT * EXCEPT()` significantly improves readability by simplifying your query. However, there is a risk. When your table schema has a new column added,  `SELECT * EXCEPT()` allows that new column to pass into your query output and potentially impact downstream logic. In general, explicitly listing which columns you want in your `SELECT` statement is a best practice for long-term reliability of your data pipelines. 

Side note: Using `SELECT *` can be expensive as it loads all columns into memory. Just don't do it. For tables with many columns, it's more performant and cost effective to explicitly reference the columns you want in your `SELECT` statement. 

## QUALIFY
What's the thorn in any data engineer's day? Duplicate records. They're the bump in the road that ruins an otherwise beautiful morning of flawless querying. 

A common deduplication tactic is to...

1. group records together by some common trait,
2. sort and rank the records within each group,
3. take the top record from each group. 

Most of us write a subquery to handle the first two steps and an outer query to grab one row from each group (the 3rd step). This gets the job done, but it can be verbose and hard to read. 

BigQuery's [`QUALIFY`](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax#qualify_clause) clause makes de-duping easier. You simply add a single line to the end of the query that magically filters the results of your window function. Take a look at these two options, and tell me which one is better. Here, we want the Hogwarts student with the highest Potions grade in each Year: 

```sql
-- option 1: traditional filtering by window function
SELECT 
	FirstName,
	LastName,
	`Year`,
	Potions_Grade,
FROM (
	SELECT 
		FirstName,
		LastName,
		`Year`,
		Potions_Grade,
		RANK() OVER (PARTITION BY `Year` ORDER BY Potions_Grade DESC) standing
	FROM HOGWARTS.GRADEBOOK
) a
WHERE a.standing = 1;
```

```sql
-- option 2: filtering with QUALIFY
SELECT 
	FirstName,
	LastName,
	`Year`,
	Potions_Grade,
	RANK() OVER (PARTITION BY `Year` ORDER BY Potions_Grade DESC) standing
FROM HOGWARTS.GRADEBOOK
QUALIFY standing = 1;
```

No subquery is needed when using `QUALIFY`. It may not seem like a big deal for this toy example, but the `QUALIFY` clause can make a SQL file with thousands of lines of code and several de-duping steps much more readable. 

Also, you don't have to include the window function in the `SELECT` statement. You could perform the grouping and ranking within the `QUALIFY` clause itself; the following gives the same result:

```sql
-- option 2 bonus: window function within QUALIFY clause
SELECT 
	FirstName,
	LastName,
	`Year`,
	Potions_Grade
FROM HOGWARTS.GRADEBOOK
QUALIFY RANK() OVER (PARTITION BY `Year` ORDER BY Potions_Grade DESC) = 1;
```



## TABLESAMPLE
Hey, there's a new table! Let's grab a few rows with `SELECT *` and see what's inside. WAIT! ...

With on-demand compute pricing, BigQuery charges based on the amount of data scanned. You may think tacking `LIMIT 10` to the end of your query will reduce the amount of data scanned and lower the cost of your query. You are wrong. While `LIMIT` reduces the number of records returned to you, all records in the table are still scanned when executing the query. So even if you want a small piece of the pie, you're still charged for the whole pie. (What a crime.) 

Enter [`TABLESAMPLE`](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax#tablesample_operator). This function does what it says. It captures a percentage of the table's records and returns them to you. You're only charged for the <u>records that are sampled</u> instead of all records in the table. Use `TABLESAMPLE` as you frolic through new tables to avoid large Google bills at the end of the month. 

```sql
-- get random sample of 5% of gradebook
SELECT * 
FROM HOGWARTS.GRADEBOOK 
TABLESAMPLE SYSTEM (5 PERCENT);
```

## ARRAY Column Type
Call me outdated, but I grew up with plain 'ole tables. You know, the ones that have columns and rows with only one value at each intersection of column and row. BigQuery is different. In BigQuery tables, a single column of a single row can have *multiple* values of the same type, embedded in an array. Here's an example where we track house points earned by our favorite students: 

```sql
SELECT 
	FirstName,
	LastName,
	House,
	HousePoints  --  <---------- Here's the ARRAY column
FROM HOGWARTS.GRADEBOOK;


| FirstName | LastName | House      |                     HousePoints |
| --------- | -------- | ---------- | ------------------------------: |
| Harry     | Potter   | Gryffindor |                  [10, -150, 50] |
| Draco     | Malfoy   | Slytherin  |               [10, 30, 15, -50] |
| Hermione  | Granger  | Gryffindor | [10, 10, 25, 10, 5, 15, 10, 30] |
| Ron       | Weasley  | Gryffindor |                      [10, -150] |
```

Alright, so why the heck would we use `ARRAY` data types? The traditional rules of data modeling emphasize normalizing our tables. That is, we would have a completely separate table tracking the house point accumulation; each row would represent a time some witch or wizard earned or lost points. 

The `ARRAY` data type opens the door to modern data warehousing techniques. By embedding multiple values in a single row and column intersection, we reduce the number of joins or table lookups. Instead of looking up the house points our Hogwarts students earned in a separate table, we can access those values directly in the same Gradebook table. This improves read performance of our queries and can be especially effective for large tables. More specifically, the fully normalized approach of joining two tables requires data shuffling among VMs to match records between the two tables; using an `ARRAY` column as an alternative reduces this shuffling because all required data is already located together in the same large table.  

If you want to access elements within an array, you can use the `UNNEST` SQL function. Below, we use `UNNEST` to make the house points available for aggregation. 

```sql
-- total house points earned or lost by student
SELECT
	FirstName,
	LastName,
	(
		SELECT
			SUM(p)
		FROM
			UNNEST (g.HOUSEPOINTS) AS p
	) AS HousePoints_Total
FROM
	HOGWARTS.GRADEBOOK AS g;

| FirstName | LastName | HousePoints_Total |
| --------- | -------- | ----------------: |
| Harry     | Potter   |               -90 |
| Draco     | Malfoy   |                 5 |
| Hermione  | Granger  |               115 |
| Ron       | Weasley  |              -140 |
```

Behind the scenes, `UNNEST` expands the array into as many rows as there are elements; it essentially creates a "mini-table" with one row for each element in the array. Once the array contents are unpacked, we can call aggregation functions, like `SUM()` in the example above. Or we can filter our original table for a certain array element by using `UNNEST` in a `WHERE` clause. 

This is just the tip of the iceberg for the `ARRAY` data type and its sister data type `STRUCT`. For more examples of how you can play with repeated or nested data types, check out the [Google docs](https://cloud.google.com/bigquery/docs/arrays). 

---

We'll stop here for today. These are the SQL features I've enjoyed the most after my first taste of BigQuery. Keep them in mind the next time you roam through a data warehouse. 

What'd I miss? Give me a [shout](https://kpdata.dev) if you want to share what you love or hate about GoogleSQL. 