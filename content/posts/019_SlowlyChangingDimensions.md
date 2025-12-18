Title: Slowly Changing Dimensions
Date: 2025-12-19
Slug: slowly-changing-dimensions
Tags: data-engineering
Summary: [insert]
Status: draft


Confession: I mucked up the CFO's reports.

A huge customer moved to another state. Like a good data engineer, I updated the customer's address in the data warehouse.

When an annual report went out, the CEO asked why the historical numbers by state were different.

Answer: The data warehouse now had no record of the customer's previous address.

That's when I felt the pain of poor data modeling. My data warehouse was not designed to reflect the real world, like customers hopping to new locations. 

That's also when I came across "Slowly Changing Dimension" tables.

Today we'll discuss what SCDs are and which types are commonly used. Let's go!

## Background

In the world of data modeling, the Kimball Data Model features a fact table linked to several dimension tables. Records in a fact table describe an event, or something that happened. Rows may represent a transaction on Amazon or someone checking into the hospital.

Here's a sample fact table of encounters at St. Mungo's Hospital for Magical Maladies and Injuries:

`fct_encounter`

<div markdown=1 class="overflow-x-auto">

| id     | patient_id | encounter_date | diagnosis_code | diagnosis_desc                | treatment_code | treatment_desc             | total_cost |
| ---    | ---        | ---            | ---            | ---                           | ---            | ---                        | --:        |
| E10001 | P001       | 1997-05-15     | SM-101         | Basilisk Venom Exposure       | SP-17          | Essence of Phoenix Feather | 1200       |
| E10002 | P001       | 1996-02-12     | SM-205         | Broken Wand Backfire Injury   | SP-03          | Wand-Core Realignment      | 300        |
| E10003 | P002       | 1995-07-21     | SM-330         | Quidditch Bludger Head Trauma | SP-21          | Cranial Healing Charm      | 450        |

</div>

Dimension tables, on the other hand, describe things, like customers, dates, suppliers, etc.

Here's an example of a Dimension table that describes patients at St. Mungo's:

`dim_patient`

<div markdown=1 class="overflow-x-auto">

| id   | first_name | last_name | date_of_birth | address                         |
| ---  | ---        | ---       | ---           | ---                             |
| P001 | Harry      | Potter    | 1980-07-31    | 4 Privet Drive, Little Whinging |
| P002 | Ron        | Weasley   | 1980-03-01    | The Burrow, Ottery St Catchpole |
| P003 | Hermione   | Granger   | 1979-09-19    | 34 Tennyson Road, London        |

</div>

This dimension table allows us to look up patients by their IDs. We can see patients' names, birth dates, addresses, etc.

Fact tables are joined to Dimension tables by keys. For example, joining these two tables by `fct_encounter.patient_id = dim_patient.id` would show us that us Harry (P001) was hit with basilisk venom and a wand backfire; Ron (P002) experienced a bludger blow.

Unsurprisingly, "slowly changing dimension" tables are **dimension** tables from Kimball's model. The "slowly changing" descriptor indicates data in the dimension table should rarely change. SCDs have different types, or frameworks, for how to update the dimension table with such changes.

As a result, you get to keep track of what the current attributes of a dimension table are as well as historical snapshots.

## SCD Type 1

I had a Type 1 SCD when I foolishly updated the address for that customer. In Type 1 SCDs, an update to a record simply overwrites the record.

For example, Harry lives with his aunt and uncle at number 4, Privet Drive. But he later inherits his godfather's house. The `dim_patient` table would be updated as such:

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>Before</strong></p>

<div markdown=1 class="overflow-x-auto">

| id   | first_name | address                         |
| ---  | ---        | ---                             |
| P001 | Harry      | 4 Privet Drive, Little Whinging |
| P002 | Ron        | The Burrow, Ottery St Catchpole |
| P003 | Hermione   | 34 Tennyson Road, London        |

</div>

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>After</strong></p>

<div class="overflow-x-auto">

<table>
<thead>
<tr>
<th>id</th>
<th>first_name</th>
<th>address</th>
</tr>
</thead>
<tbody>
<tr>
<td>P001</td>
<td>Harry</td>
<td class="highlight-cell">12 Grimmauld Place, London</td>
</tr>
<tr>
<td>P002</td>
<td>Ron</td>
<td>The Burrow, Ottery St Catchpole</td>
</tr>
<tr>
<td>P003</td>
<td>Hermione</td>
<td>34 Tennyson Road, London</td>
</tr>
</tbody>
</table>

</div>

</div>
</div>


This approach gives you a current snapshot of the dimension state. But you lose historical records. And when finance inevitably asks you to run a historic report, you're stuck. You don't know where Harry lived before 12 Grimmauld Place.

## SCD Type 2

Type 2 SCDs are the next level. When a change occurs in real life, rather than updating the existing record, we insert a new record:


<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>Before</strong></p>

<div markdown=1 class="overflow-x-auto">

| id   | first_name | address                         |
| ---  | ---        | ---                             |
| P001 | Harry      | 4 Privet Drive, Little Whinging |
| P002 | Ron        | The Burrow, Ottery St Catchpole |
| P003 | Hermione   | 34 Tennyson Road, London        |

</div>

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>After</strong></p>

<div class="overflow-x-auto">

<table>
<thead>
<tr>
<th>id</th>
<th>first_name</th>
<th>address</th>
</tr>
</thead>
<tbody>
<tr>
<td>P001</td>
<td>Harry</td>
<td>4 Privet Drive, Little Whinging</td>
</tr>
<tr class="highlight-cell">
<td>P001</td>
<td>Harry</td>
<td>12 Grimmauld Place, London</td>
</tr>
<tr>
<td>P002</td>
<td>Ron</td>
<td>The Burrow, Ottery St Catchpole</td>
</tr>
<tr>
<td>P003</td>
<td>Hermione</td>
<td>34 Tennyson Road, London</td>
</tr>
</tbody>
</table>

</div>

</div>
</div>


Great. Now we have two records for Harry. But when it comes to join the dimension table to fact tables... which record of Harry should we use? It's hard to tell.

That's why Type 2 SCDs have helper columns to identify when each version of a row is active. A common way of handling that is to add `start_date` and `end_date` columns which outline the window of time the record is effective. So if we updated Harry's address on 1998-12-31, our SCD would look like this:

<div class="overflow-x-auto">

<table>
<thead>
<tr>
<th>id</th>
<th>start_date</th>
<th>end_date</th>
<th>first_name</th>
<th>address</th>
</tr>
</thead>
<tbody>
<tr>
<td>P001</td>
<td class="highlight-cell">1991-01-01</td>
<td class="highlight-cell">1998-06-30</td>
<td>Harry</td>
<td class="highlight-cell">4 Privet Drive, Little Whinging</td>
</tr>
<tr>
<td>P001</td>
<td class="highlight-cell">1996-07-01</td>
<td class="highlight-cell">9999-12-31</td>
<td>Harry</td>
<td class="highlight-cell">12 Grimmauld Place, London</td>
</tr>
<tr>
<td>P002</td>
<td>1990-01-01</td>
<td>9999-12-31</td>
<td>Ron</td>
<td>The Burrow, Ottery St Catchpole</td>
</tr>
<tr>
<td>P003</td>
<td>1992-07-01</td>
<td>9999-12-31</td>
<td>Hermione</td>
<td>34 Tennyson Road, London</td>
</tr>
</tbody>
</table>

</div>

Here, the first record was active from 1991-01-01 to 1996-06-30; the values of `start_date` and `end_date` tell us that. But second record is active from 1996-07-01 to... 9999-12-31?

This "high date" is a convention commonly used to indicate which record is active. It's useful when you're filtering records via SQL's BETWEEN statement. You may also see NULL values for the `end_date` of the active record.

When it's time to join our fact table to our dimension table, our join may look like this:

```sql
SELECT *
FROM fct_treatment t
JOIN dim_patient p
    ON t.patient_id = p.id
    AND t.treatment_date BETWEEN p.start_date AND p.end_date;
```

There are other ways to indicate when each record is active.

- Make a surrogate key for the dimension table. Each time the entity in a dimension table updates, the new record gets a new surrogate key, which uniquely identifies that entity. The record in the fact table would have a foreign key to the dimension table's surrogate key.
- Set up additional flag columns like `is_active` with boolean values to indicate which rows are the most current.
- Add a version number field with the most up-to-date record having the highest value.

The options go on. But for now, let's check out other SCD types.


## SCD Type 3

Spoiler alert: I don't like Type 3. Here it goes: When a dimension record changes, Type 3 tables do not create a new row. Instead new fields are added to mark the old value and the new value.

For example,


<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>Before</strong></p>

<div markdown=1 class="overflow-x-auto">

| id   | first_name | address                         |
| ---  | ---        | ---                             |
| P001 | Harry      | 4 Privet Drive, Little Whinging |

</div>

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>After</strong></p>

<div markdown=1 class="overflow-x-auto">

| id   | first_name | original_address                | current_address            | effective_date|
| ---  | ---        | ---                             | ---                        | ---           |
| P001 | Harry      | 4 Privet Drive, Little Whinging | 12 Grimmauld Place, London | 1996-07-01    |

</div>

</div>
</div>

When Harry's address changes, a new field `current_address` is added to reflect his current residence. The `original_address` then updates to his previous residence. This allows history to be baked into the row itself.

However, there are two cons:

- Type 3 SCDs track limited history. Mr. Potter moves again, we'll update `current_address` and lose track how he once lived at Grimmauld Place.
- The field count can explode. Here we chose to add a field for address, so we have `original_address` and `current_address`. But what about other fields? Shold we add current/original pairs for `last_name`, `phone_number`, `marital_status`?

## SCD Type 4

Separate current and history table

## SCD Type 6 - maybe nix

---

[ insert cheatsheet on when to use each type ]

The types of SCD go on to Type 5 and 6. You can check it out if curious.

In practice, I've mainly seen type 1 or type 2.

