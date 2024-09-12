Title: BigQuery Flavor of SQL
Date: 2024-09-12
Slug: bigquery-flavor-of-sql
Tags: sql, gcp, data-engineering
Summary: What are some of the unique features of Google's flavor of SQL? Let's dive into some helpful syntax for day-to-day querying.  
Status: draft

It comes in many flavors. Some old, some new. Some mainstream, some flat-out quirky. You know what I'm talking about: SQL. 

ANSI SQL, T-SQL, PL/SQL, MySQL, PostgreSQL, SQLite, SparkSQL, HiveQl, GoogleSQL, ... 

SQL is a household name (at least among developers). The language has been around for decades, and new varieties came out every few years. The core of the language is the same, but each flavor has a unique spin on how we wrangle our relational tables. A few months ago, I took my first bite of BigQuery's SQL, called [GoogleSQL](https://cloud.google.com/bigquery/docs/introduction-sql). This flavor has some cool features to make your daily querying tasks easier. Let's check them out: 

## SELECT * EXCEPT
Picture this: You have a column with hundreds of columns. You're doubtful even 10% of them are being used, but hey you're not the decision-maker for this OneBigTable design. Let's say you need most of the columns for your query but not others. Do you want to write out the hundreds of columns individually? 

Rather than going the painful exercise, BigQuery SQL offers [`SELECT * EXCEPT()`](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax#select_except). You can quickly capture the same columns by writing the few columns you do NOT want. The two options below generate the same results. But one of them preserves your sanity. 

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

Using `SELECT * EXCEPT()` significantly improves readability by simplifying your query. However, there is a risk. When your table schema has a new column added,  `SELECT * EXCEPT()` allows that new column to pass into your query definition and potentially impact downstream logic. Generally, explicitly listing which columns you want in your `SELECT` statement is a best practice for long-term reliability of your data pipelines. 

Side note: Using `SELECT *` can be expensive as it loads all columns into memory. Just don't do it. For tables with many columns, it's more performant and cost effective to explicitly reference the columns you want in your `SELECT` statement. 

## QUALIFY
What's the thorn in any data engineer's day? Duplicate records. They're the bump in the road that screws up your otherwise flawless query logic. 

A common "de-dup" tactic is to sort and rank the records by some grouping and then take one record from each group. Most often, this is done by writing a subquery to determine the rank and an outer query to filter for one row from each group, which could look messy. 

BigQuery's [`QUALIFY`](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax#qualify_clause) statement makes de-duping via analytics functions easier. You can simply add a single line to the end of the query that automatically filters the results of your window function. Take a look at the two options and you tell me which one is better. Here, we want the Hogwarts student with the highest Potions grade for each Year: 

```sql
-- traditional filtering of analytics function
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
-- filtering with QUALIFY
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

Also, you don't have to include the window function in the SELECT statement, you could just perform your ranking within the QUALIFY statement itself; the following gives the same results:

```sql
-- window function within QUALIFY clause
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

Enter [`TABLESAMPLE`](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax#tablesample_operator). This function does what it says. It captures a percentage of the table's records and returns them to you. You're only charged for the records that are sampled instead of all of the records in the table. 

```sql
-- get random sample of 5% of gradebook
SELECT * 
FROM HOGWARTS.GRADEBOOK 
TABLESAMPLE SYSTEM (5 PERCENT);
```

## ARRAY and STRUCT Column Types
Call me outdated, but I grew up with plain 'ole tables. You know, the ones that have columns and rows with only one value at each intersection of column and row. BigQuery is different. In BigQuery tables, a single column of a single row can have *multiple* values of the same type, embedded in an array. This can be a data warehousing technique that reduces the number of joins or table lookups. For example, instead of having to look up the house points our Hogwarts students earned in a separate table, we can access those values directly in the same Gradebook table: 

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

If you want to access elements within an array or perform some kind of aggregation, you can use the `UNNEST` SQL function. Below, we include the `UNNEST` function in the `FROM` clause to make the house points available for aggregation. 

```sql
-- total house points earned or lost by student
SELECT 
	FirstName, 
	LastName,
	SUM(points) HousePoints_Total
FROM
	HOGWARTS.GRADEBOOK
	CROSS JOIN UNNEST(HOGWARTS.GRADEBOOK.HousePoints) AS points
GROUP BY 1, 2;


| FirstName | LastName | HousePoints |
| --------- | -------- | ----------: |
| Harry     | Potter   |         -90 |
| Draco     | Malfoy   |           5 |
| Hermione  | Granger  |         115 |
| Ron       | Weasley  |        -140 |
```

Behind the scenes, `UNNEST` expands the array into as many rows as there are elemnts within the array; when used in the `FROM` clause, the function performs a correlated cross join with the original row the array is associated with. This sounds more complicated than it really is. 


But wait... there's more. A single column of a single row can have multiple values of different types. STRUCT types create a "row-within-a-row" effect. (Not too different from a dream-within-a-dream from Inception.) 


STRUCT and ARRAY column types This is new for me. I'm used to plain 'ole tables, the ones that have columns and rows and only one value per each intersection of column and role. BigQuery is different. It features the ability to embed arrays within a single column of a single row. The values of each element of the array must be the same. In addition, BigQuery has nested column types. Think row within a row. These two features introduce a host of new SQL functions for data manipulation.  

`array_to_string` - this converts an array column into a string by combining the elements with a given separator
`unnnest` - this essentially explodes an array or nested column into as many rows as there are elements in the array
`array_agg` is an aggregation function that can combine several records of scalar values into a single array. 
[ need to confirm types of nested and array ] 
[ need to read up on array and struct manipulation before I can write about it]

ARRAY, UNNEST, STRUCT, ARRAY_AGG, ARRAY_TO_STRING
	- use UNNEST to filter for array content
WITH OFFSET

---

