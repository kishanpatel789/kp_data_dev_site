Title: BigQuery Flavor of SQL
Date: 2024-09-12
Slug: bigquery-flavor-of-sql
Tags: sql, gcp, data-engineering
Summary: What are some of the unique features of Google's flavor of SQL? Let's dive into some helpful syntax for day-to-day querying.  
Status: draft

It comes in many flavors. Some old, some new. Some mainstream, some flat-out quirky. You know what I'm talking about: SQL. 

ANSI SQL, T-SQL, PL/SQL, MySQL, PostgreSQL, SQLite, SparkSQL, HiveQl, GoogleSQL, ... 

SQL is a household name. The language has been around for decades, and new varieties came out every few years. The core of the language is the same, but each flavor has a unique spin on how we wrangle our relational tables. A few months ago, I took my first bite of BigQuery SQL (or GoogleSQL). This flavor has some cool features to make your daily querying a bit easier. Here we go: 

## SELECT * EXCEPT
Picture this: You have a column with hundreds of columns. You're doubtful even 10% of them are being used, but hey you're not the decision maker for this OneBigTable design. Let's say you need most of the columns for your query but not others. Do you want to list out the hundreds of columns individually? 
Rather than going the painful exercise, BigQuery SQL offers `SELECT * EXCEPT()`. You can quickly capture the same columns by writing the columns you do NOT want. This is also a quick fix when a downstream query breaks because it uses `SELECT *`, and the source table all of a sudden introduced additional columns breaking your query. 
On that note, SELECT * can be expensive as it loads all the columns into memory. For tables with many columns, it's more performant and cost effective to explicitly reference the columns you want in your SELECT statement. 

[ADD EXAMPLE]

## QUALIFY
What's the thorn in any data engineer's day? Duplicate records. They have a tendency to creep in quietly and cause downstream effects without you realizing it. 
A common "de-dup" tactic is to sort and rank the records by some grouping and then take one record from each group. Most often, this is done by using a subquery to determine the rank and an outer query to filter for one row from each group, which could look messy. 
BigQuery's QUALIFY statement makes de-duping via analytics functions easier. You can simply add a single line to the end of the query that automatically filters by the analytics column stated in the SELECT clause. Take a look at the two options and you tell me which one is better: 

```sql
-- traditional filtering of analytics function
SELECT * 
FROM (
	SELECT 
		student, 
		grade, 
		RANK() OVER (PARTITION BY class ORDER BY grade DESC) standing
	FROM HOGWARTS.GRADEBOOK
) a
WHERE a.standing = 1;
```

```sql
-- using QUALIFY eliminates need for subquery
SELECT 
	student, 
	grade, 
	RANK() OVER (PARTITION BY class ORDER BY grade DESC) standing
FROM HOGWARTS.GRADEBOOK
QUALIFY standing = 1;
```

No subquery is needed with QUALIFY. This may not seem like a big deal for this toy example, but it can make a SQL file with thousands of lines of code much more readable. 

## TABLESAMPLE
Hey, there's a new table! Let's grab a few rows with `SELECT *` and see what's inside. WAIT!...
With on-demand compute pricing, BigQuery charges based on the amount of data scanned. You may think that adding LIMIT 10 to your query will reduce the amount of data scanned and reduce the cost of your query. You are wrong. While LIMIT reduces the number of records returned to you, all records in the table are still scanned when executing the query. So even if you want a small piece of the pie, you're still charged for the whole pie; what a crime. 
Enter TABLESAMPLE. This function does what it says. It captures a percentage of the tables records and returns them to you. You're only charged for the records that are sampled instead of all of the records in the table. 

```sql
SELECT * FROM HOGWARTS.GRADEBOOK TABLESAMPLE SYSTEM (5 PERCENT);
```

## ARRAY and STRUCT Column Types
Call me old fashioned, but I'm used to plain 'ole tables. You know, the ones that have columns and rows with only one value for each intersection of column and row. BigQuery is different. In BigQuery tables, a single column of a single row can have *multiple* values, embedded in an array. The values of each element of the array must be the same.

But wait... there's more. A single column of a single row can have multiple values of different types. STRUCT types create a "row-within-a-row" effect. (Not to different from a dream-within-a-dream from Inception.) 


STRUCT and ARRAY column types This is new for me. I'm used to plain 'ole tables, the ones that have columns and rows and only one value per each intersection of column and role. BigQuery is different. It features the ability to embed arrays within a single column of a single row. The values of each element of the array must be the same. In addition, BigQuery has nested column types. Think row within a row. These two features introduce a host of new SQL functions for data manipulation.  `array_to_string` - this converts an array column into a string by combining the elements with a given separator
`unnnest` - this essentially explodes an array or nested column into as many rows as there are elements in the array
`array_agg` is an aggregation function that can combine several records of scalar values into a single array. 
[ need to confirm types of nested and array ] 
[ need to read up on array and struct manipulation before I can write about it]

ARRAY, UNNEST, STRUCT, ARRAY_AGG, ARRAY_TO_STRING
	- use UNNEST to filter for array content
WITH OFFSET

---

