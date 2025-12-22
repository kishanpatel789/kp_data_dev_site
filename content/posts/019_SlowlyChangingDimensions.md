Title: Slowly Changing Dimensions
Date: 2025-12-19
Slug: slowly-changing-dimensions
Tags: data-engineering, data-modeling
Summary: Good data modeling includes updating records without losing the old ones. Kimball introduces various types of slowly changing dimension records to do just that. 
Status: draft


I mucked up the CFO's report.

A huge customer moved to another state. Like a good minion, I updated the customer's address in the data warehouse.

When the annual report went out, the CEO asked why the historical numbers by state were different. 😰

Answer: The data warehouse now had no record of the customer's previous address.

That's when I felt the pain of poor data modeling. My data warehouse was not designed to reflect the real world, like customers hopping to new locations. 

That's also when I came across "Slowly Changing Dimension" tables.

Today we'll discuss what SCDs are and which types are commonly used. Let's go!

## Background

In the world of data modeling, the Kimball Data Model features a **fact** table linked to several **dimension** tables. Records in a fact table describe an event, or something that happened. Rows may represent a transaction on amazon.com or someone checking into the hospital.

Here's a sample fact table of encounters at St. Mungo's Hospital for Magical Maladies and Injuries:

<p markdown=1 class="text-center">
`fct_encounter`
</p>

<div markdown=1 class="overflow-x-auto">

| id     | patient_id | encounter_date | diagnosis_code | diagnosis_desc                | treatment_code | treatment_desc             | total_cost |
| ---    | ---        | ---            | ---            | ---                           | ---            | ---                        | --:        |
| E10001 | P001       | 1997-05-15     | SM-101         | Basilisk Venom Exposure       | SP-17          | Essence of Phoenix Feather | 1200       |
| E10002 | P001       | 1996-02-12     | SM-205         | Broken Wand Backfire Injury   | SP-03          | Wand-Core Realignment      | 300        |
| E10003 | P002       | 1995-07-21     | SM-330         | Quidditch Bludger Head Trauma | SP-21          | Cranial Healing Charm      | 450        |

</div>

Each record represents what happened to a patient, like the diagnosis, treatment, and cost. 

Dimension tables, on the other hand, describe things, like customers, products, locations, etc.

Here's a dimension table that describes patients at St. Mungo's:

<p markdown=1 class="text-center">
`dim_patient`
</p>

<div markdown=1 class="overflow-x-auto">

| id   | first_name | last_name | date_of_birth | address                         |
| ---  | ---        | ---       | ---           | ---                             |
| P001 | Harry      | Potter    | 1980-07-31    | 4 Privet Drive, Little Whinging |
| P002 | Ron        | Weasley   | 1980-03-01    | The Burrow, Ottery St Catchpole |
| P003 | Hermione   | Granger   | 1979-09-19    | 34 Tennyson Road, London        |

</div>


This dimension table lets us to look up patients by their IDs. We see patients' names, birth dates, addresses, etc.

Fact tables are joined to dimension tables by keys. For example, joining these two tables on `fct_encounter.patient_id = dim_patient.id` shows us that us Harry (P001) was hit with basilisk venom and a wand backfire; Ron (P002) experienced a bludger blow.

But what makes a dimension table "slowly changing?" In general, records in dimension tables should not change. It's uncommon for someone to change their name and near impossible to change their birth date. But every now and then, data in dimension tables need to be updated... hence, "slowly changing."

SCDs have different types, or frameworks, for how to update the dimension table with such changes. These frameworks maintain the current value of each attribute (i.e. each column for a given row) and give a way to capture historical values.

## SCD Type 1

In Type 1 SCDs, an update to a record simply overwrites the record. A historic version of the record is not kept. I had a Type 1 SCD when I foolishly updated the address for that customer.

For example, Harry lives with his aunt and uncle at 4 Privet Drive. But he later inherits his godfather's house. The `dim_patient` table would be updated as such:

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

That said, there is a place for Type 1 SCDs. Type 1 tables are useful when you don't care about historical analysis. Sometimes only the current value matters, like when you need contact info for customers. 

## SCD Type 2

Type 2 SCDs are the next level. When a change occurs, rather than updating the existing record, we insert a new record:

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

That's why Type 2 SCDs have helper columns to identify when each version of a row is active. For instance, the `start_date` and `end_date` columns outline the window of time each record is effective. If we update Harry's address on 1996-06-30, `dim_patient` looks like this:

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
<td class="highlight-cell">1981-10-31</td>
<td class="highlight-cell">1996-06-30</td>
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

Here, the first record was active from 1981-10-31 to 1996-06-30; the values of `start_date` and `end_date` tell us that. But second record is active from 1996-07-01 to... 9999-12-31?

This "high end date" is a convention used to indicate which record is current. It's useful when you're filtering records via SQL's BETWEEN statement. You may also see NULL values for the `end_date` of the active record.

When it's time to join the fact and dimension tables, our join may look like this:

```sql
SELECT *
FROM fct_encounter e
JOIN dim_patient p
    ON e.patient_id = p.id
    AND e.treatment_date BETWEEN p.start_date AND p.end_date;
```

There are other ways to indicate when each record is active.

- Make a surrogate key for the dimension table. Each time the entity in a dimension table updates, the new record gets a new surrogate key, which uniquely identifies that entity. The record in the fact table would have a foreign key to the dimension table's surrogate key.
- Set up additional flag columns like `is_active` with boolean values to indicate which rows are current.
- Add a version number field with the most up-to-date record having the highest value.

The options go on. But for now, let's check out other SCD types.


## SCD Type 3

Spoiler alert: I don't like Type 3. Here it goes: When a dimension record changes, Type 3 tables do not create a new row. Instead new fields are added to mark the old value and the new value.

The first time an address changes, the column `address` is renamed to `original_address`. Then new columns `current_address` and `effective_date` are added. This shows the original and current values in separate columns while `effective_date` indicates when the current address took effect. 

This allows historic values to be "baked" into the row itself:

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

<div class="overflow-x-auto">

<table>
<thead>
<tr>
<th>id</th>
<th>first_name</th>
<th class="highlight-cell">original_address</th>
<th class="highlight-cell">current_address</th>
<th class="highlight-cell">effective_date</th>
</tr>
</thead>
<tbody>
<tr>
<td>P001</td>
<td>Harry</td>
<td>4 Privet Drive, Little Whinging</td>
<td class="highlight-cell">12 Grimmauld Place, London</td>
<td class="highlight-cell">1996-07-01</td>
</tr>
</tbody>
</table>

</div>

</div>
</div>

However, there are two cons:

- Type 3 SCDs track limited history. When Mr. Potter moves again, we'll update `current_address` and lose track how he once lived at Grimmauld Place. Effectively, we can only keep track of "current" and "original" values.
- The field count can explode. Here we chose to add a field for address, so we have `original_address` and `current_address`. But what about other fields? Should we add current/original pairs for `last_name`, `phone_number`, `marital_status`? The table can quickly become too wide to be manageable. 

For these reasons, Type 3 SCDs are useful only to track one prior version of a value. It should not be used for full historical tracking.

## SCD Type 4

Type 4 is where we begin parting the waters. This approach uses two separate tables for the dimension: a current table and a historic table. 

Unsurprisingly, the current table has only the current version of each record. The historic table has all versions with a timestamp of when the record became active. 

When a change occurs, the record in the current table is updated, and a new record is inserted in the historic table. 

Mr. Potter's new address can be modeled in tables `dim_patient` and `dim_patient_hist` as such:

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>Before</strong></p>
<p markdown=1 class="text-center">
`dim_patient`
</p>

<div markdown=1 class="overflow-x-auto">

| id   | first_name | address                         |
| ---  | ---        | ---                             |
| P001 | Harry      | 4 Privet Drive, Little Whinging |

</div>

<p markdown=1 class="text-center">
`dim_patient_hist`
</p>

<div markdown=1 class="overflow-x-auto">

| id   | first_name | address                         | effective_date | 
| ---  | ---        | ---                             | ---            | 
| P001 | Harry      | 4 Privet Drive, Little Whinging | 1981-10-31     | 

</div>

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>After</strong></p>
<p markdown=1 class="text-center">
`dim_patient`
</p>

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
</tbody>
</table>

</div>

<p markdown=1 class="text-center">
`dim_patient_hist`
</p>

</div>
</div>


---


The types of SCD go on to Type 5 and 6. You can check it out if curious.


[ insert cheatsheet on when to use each type ]

In practice, I've mainly seen type 1 or type 2.

