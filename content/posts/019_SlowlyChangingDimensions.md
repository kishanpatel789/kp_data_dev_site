Title: Slowly Changing Dimensions
Date: 2025-12-24
Slug: slowly-changing-dimensions
Tags: data-engineering, data-modeling
Summary: Good data modeling updates records without losing the old ones. Kimball introduces slowly changing dimension tables to do just that. 
Status: published
MetaImage: /static/images/post019/SCDThumbnail.jpg


I mucked up the CFO's report.

A huge customer moved to another state. Like a good minion, I updated the customer's address in the data warehouse.

When the annual report went out, the CFO asked why the historical totals by state were different. 😰

Answer: The data warehouse had no record of the customer's previous address. My change overwrote the old address.

That's when I felt the pain of poor data modeling. My data warehouse was not designed to reflect what the company needed, like customers' current address AND their previous addresses. 

That's also when I came across "Slowly Changing Dimension" tables.

Save your butt from the CFO's fire. Use Slowly Changing Dimensions (SCDs) in your data warehouse.

## Background

In the world of data modeling, the Kimball Data Model features a **fact** table linked to several **dimension** tables. 

Records in a fact table describe *events*. Rows may represent a transaction on amazon.com or someone checking into the hospital.

Here's a sample fact table of medical encounters at St. Mungo's Hospital for Magical Maladies and Injuries:

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

Dimension tables, on the other hand, describe *things*. Records in a dimension table may represent customers, products, or locations.

Here's a dimension table of patients at St. Mungo's:

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


This dimension table lets us to look up patients by their IDs. We see patients' names, birthdates, addresses, etc.

Fact tables are joined to dimension tables by keys. For example, joining these two tables on `fct_encounter.patient_id = dim_patient.id` shows us that us Harry (P001) was hit with basilisk venom and a wand backfire; Ron (P002) experienced a bludger blow.

But what makes a dimension table "slowly changing?" In general, records in dimension tables should not change. It's uncommon for someone to change their name and near impossible to change their birthdate. But every now and then, data in dimension tables need to be updated... hence, "slowly changing."

SCDs have different types, or frameworks, for how to update the dimension table with such changes. These frameworks maintain the current value of each attribute (i.e. each column in a table), and some give a way to keep historical values.

## SCD Type 1

In Type 1 SCDs, new info replaces old info. Every time a change occurs, the new value overwrites the old one. A historical version of the record is not kept. I had a Type 1 SCD when I foolishly updated the address for that customer.

For example, Harry lives with his aunt and uncle at 4 Privet Drive. But he later inherits his godfather's house at 12 Grimmauld Place. A Type 1 `dim_patient` table is updated as such:

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>Before</strong></p>

<p markdown=1 class="text-center">
`dim_patient`
</p>
<div markdown=1 class="overflow-x-auto">

| id   | first_name | address          |
| ---  | ---        | ---              |
| P001 | Harry      | 4 Privet Drive   |
| P002 | Ron        | The Burrow       |
| P003 | Hermione   | 34 Tennyson Road |

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
<td class="highlight-cell">12 Grimmauld Place</td>
</tr>
<tr>
<td>P002</td>
<td>Ron</td>
<td>The Burrow</td>
</tr>
<tr>
<td>P003</td>
<td>Hermione</td>
<td>34 Tennyson Road</td>
</tr>
</tbody>
</table>

</div>

</div>
</div>


This approach gives the current state of the dimension. But you lose historical records. And when the CFO inevitably asks for a report about the past, you're cooked. You don't know where Harry lived before 12 Grimmauld Place.

That said, there is a place for Type 1 SCDs. Type 1 tables are useful when you don't care about historical analysis. Sometimes only the current value matters, like when you need contact info for customers. 

## SCD Type 2

Type 2 SCDs are the next level. When a change occurs, rather than updating the existing record, you insert a new record:

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>Before</strong></p>

<p markdown=1 class="text-center">
`dim_patient`
</p>
<div markdown=1 class="overflow-x-auto">

| id   | first_name | address          |
| ---  | ---        | ---              |
| P001 | Harry      | 4 Privet Drive   |
| P002 | Ron        | The Burrow       |
| P003 | Hermione   | 34 Tennyson Road |

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
<td>4 Privet Drive</td>
</tr>
<tr class="highlight-cell">
<td>P001</td>
<td>Harry</td>
<td>12 Grimmauld Place</td>
</tr>
<tr>
<td>P002</td>
<td>Ron</td>
<td>The Burrow</td>
</tr>
<tr>
<td>P003</td>
<td>Hermione</td>
<td>34 Tennyson Road</td>
</tr>
</tbody>
</table>

</div>

</div>
</div>


Great. Now there are two records for Harry. But when joining the dimension table to fact tables... which record of Harry should you use? It's hard to tell.

That's why Type 2 SCDs have helper columns to identify when each version of a row is active. For instance, the `start_date` and `end_date` columns outline the window of time each record is effective. If Harry's address changes on 1996-06-30, `dim_patient` looks like this:

<p markdown=1 class="text-center">
`dim_patient`
</p>
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
<td class="highlight-cell">4 Privet Drive</td>
</tr>
<tr>
<td>P001</td>
<td class="highlight-cell">1996-07-01</td>
<td class="highlight-cell">9999-12-31</td>
<td>Harry</td>
<td class="highlight-cell">12 Grimmauld Place</td>
</tr>
<tr>
<td>P002</td>
<td>1990-01-01</td>
<td>9999-12-31</td>
<td>Ron</td>
<td>The Burrow</td>
</tr>
<tr>
<td>P003</td>
<td>1992-07-01</td>
<td>9999-12-31</td>
<td>Hermione</td>
<td>34 Tennyson Road</td>
</tr>
</tbody>
</table>

</div>

Here, the first record was active from 1981-10-31 to 1996-06-30; the values of `start_date` and `end_date` tell us that. The second record is active from 1996-07-01 to... 9999-12-31?

This "high end date" is a convention used to indicate which record is current. It's useful when you're filtering records with SQL's BETWEEN statement. You may also see NULL values for the `end_date` of the active record.

When it's time to join the fact and dimension tables, our query may look like this:

```sql
SELECT *
FROM fct_encounter e
JOIN dim_patient p
    ON e.patient_id = p.id
    AND e.encounter_date BETWEEN p.start_date AND p.end_date;
```

We pick the proper patient record (i.e. the proper record for Harry) in the join by making sure the `encounter_date` in the fact table is between the `start_date` and `end_date` in the dimension table. This effectively captures the dimension record that was active when the event in the fact table occurred. 

There are other ways to indicate which record is current:

- Set up flag columns like `is_active` with boolean values to indicate which rows are current.

<div class="overflow-x-auto">

<table>
<thead>
<tr>
<th>id</th>
<th>effective_date</th>
<th class="highlight-cell">is_active</th>
<th>first_name</th>
<th>address</th>
</tr>
</thead>
<tbody>
<tr>
<td>P001</td>
<td>1981-10-31</td>
<td class="highlight-cell">FALSE</td>
<td>Harry</td>
<td>4 Privet Drive</td>
</tr>
<tr>
<td>P001</td>
<td>1996-07-01</td>
<td class="highlight-cell">TRUE</td>
<td>Harry</td>
<td>12 Grimmauld Place</td>
</tr>
</tbody>
</table>

</div>

- Add a `version` field with the most up-to-date record having the highest value.

<div class="overflow-x-auto">

<table>
<thead>
<tr>
<th>id</th>
<th>effective_date</th>
<th class="highlight-cell">version</th>
<th>first_name</th>
<th>address</th>
</tr>
</thead>
<tbody>
<tr>
<td>P001</td>
<td>1981-10-31</td>
<td class="highlight-cell" style="text-align: right;">1</td>
<td>Harry</td>
<td>4 Privet Drive</td>
</tr>
<tr>
<td>P001</td>
<td>1996-07-01</td>
<td class="highlight-cell" style="text-align: right;">2</td>
<td>Harry</td>
<td>12 Grimmauld Place</td>
</tr>
</tbody>
</table>

</div>


The methods for identifying current records go on and on. 

The beauty of Type 2 SCDs is that each version of a record get its own row. This keeps a full history of changes, which enables historical analysis. The downside is that multiple rows represent the same thing (e.g. two rows both represent the same Harry), so you need to carefully filter the table for the version you want.

## SCD Type 3

Spoiler alert: I don't like Type 3. Here it goes: When a change occurs, Type 3 tables do not create a new row. Instead new fields are added to mark the old value and the new value.

The first time an address changes, the column `address` is renamed to `original_address`. Then new columns `current_address` and `effective_date` are added. The original and current values appear in separate columns while `effective_date` indicates when the current address took effect. 

This approach "bakes" historical values into the row itself:

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>Before</strong></p>

<p markdown=1 class="text-center">
`dim_patient`
</p>
<div markdown=1 class="overflow-x-auto">

| id   | first_name | address        |
| ---  | ---        | ---            |
| P001 | Harry      | 4 Privet Drive |

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
<th class="highlight-cell">original_address</th>
<th class="highlight-cell">current_address</th>
<th class="highlight-cell">effective_date</th>
</tr>
</thead>
<tbody>
<tr>
<td>P001</td>
<td>Harry</td>
<td>4 Privet Drive</td>
<td class="highlight-cell">12 Grimmauld Place</td>
<td class="highlight-cell">1996-07-01</td>
</tr>
</tbody>
</table>

</div>

</div>
</div>

However, there are two cons:

- Type 3 SCDs track limited history. When Mr. Potter moves again, you'll update `current_address` and lose track of how he once lived at Grimmauld Place. You can only keep track of "current" and "original" values.
- The field count can explode. This table tracks changes to the address, so you have `original_address` and `current_address`. But what about other fields? Should you add current/original pairs for `last_name`, `phone_number`, `marital_status`? The table can quickly become too wide to be manageable. 

For these reasons, Type 3 SCDs are useful only to track one prior version of a value. It should not be used for full historical tracking.

## SCD Type 4

Type 4 is where we part the waters. This approach uses two separate tables for the dimension: a current table and a historical table. 

Unsurprisingly, the current table has only the current version of each record. The historical table has all versions with a timestamp of when each record became active. 

When a change occurs, the record in the current table is updated, and a new record is inserted in the historical table. 

Mr. Potter's address change can be modeled in tables `dim_patient` and `dim_patient_hist` as such:

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

<p class="text-center"><strong>Before</strong></p>
<p markdown=1 class="text-center">
`dim_patient`
</p>

<div markdown=1 class="overflow-x-auto">

| id   | first_name | address        |
| ---  | ---        | ---            |
| P001 | Harry      | 4 Privet Drive |

</div>

<p markdown=1 class="text-center">
`dim_patient_hist`
</p>

<div markdown=1 class="overflow-x-auto">

| id   | first_name | address        | effective_date | 
| ---  | ---        | ---            | ---            | 
| P001 | Harry      | 4 Privet Drive | 1981-10-31     | 

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
<td class="highlight-cell">12 Grimmauld Place</td>
</tr>
</tbody>
</table>

</div>

<p markdown=1 class="text-center">
`dim_patient_hist`
</p>

<div markdown=1 class="overflow-x-auto">

<table>
<thead>
<tr>
<th>id</th>
<th>first_name</th>
<th>address</th>
<th>effective_date</th>
</tr>
</thead>
<tbody>
<tr>
<td>P001</td>
<td>Harry</td>
<td>4 Privet Drive</td>
<td>1981-10-31</td>
</tr>
<tr class="highlight-cell">
<td>P001</td>
<td>Harry</td>
<td>12 Grimmauld Place</td>
<td>1996-07-01</td>
</tr>
</tbody>
</table>

</div>

</div>
</div>


Originally, Harry's record in `dim_patient` and `dim_patient_hist` are basically the same. But once he inherits the new house, his address is updated in `dim_patient`, and a new record is inserted in `dim_patient_hist` with the effective date.

Type 4 SCDs keep the current dimension table small and fast for querying. You don't have to worry about multiple rows representing the same entity, like in Type 2 (e.g. there's only one row for Harry in Type 4 `dim_patient`). And for those few times you need to perform historical analysis, you use the historical table. 

---

SCDs continue to evolve to Types 5 and 6. But I've never seen them used in practice. [Check them out](https://en.wikipedia.org/wiki/Slowly_changing_dimension) if you're curious. Most of the time, engineers are happy with Type 1 and Type 2 SCDs. 

Again, Slowly Changing Dimension tables describe "things." They're designed to reflect current values while potentially giving access to historical values. Here's the cheatsheet of how each type handles data change:

<div markdown=1 class="overflow-x-auto">

| SCD Type | Update Description                                                            | 
| :-:      | ---                                                                           |
| 1        | New record replaces original record. Old record is lost.                      |
| 2        | New record added to table. Other columns identify when records are in effect. |
| 3        | Original record is modified. Extra column gives old value.                    | 
| 4        | Current dimension table is updated. New record is added to historical table.  |

</div>

Your data warehouse seems perfect on day 1. But the business will change. The unexpected will happen. Building well-designed tables will future-proof your warehouse and spare you some headache. 

Are stakeholders knocking on your door about data accuracy? [Call me](https://kpdata.dev/) if you need a data model 😘. 

