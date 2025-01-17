Title: Airflow Scheduling
Date: 2025-02-01
Slug: airflow-scheduling
Tags: airflow, data-engineering
Summary: Enjoy life and let Airflow handle the boring stuff. We're talking about how you can schedule those tasks to run for you. 
Status: draft

Life is short. Way to short to do mundane tasks. 

So when Mr. Client says, "Hey, I need this report generated and sent to me every Friday at 9AM," I look for the quickest option that does not sacrifice all my Friday mornings for the rest of my life. (I've got big dreams for my Friday mornings.)

Airflow orchestrates the tasks you need to execute. You tell the framework when you need the work done and how to do it, and like a helpful minion, it will get the job done. This is especially helpful when you have repetitive tasks that need to be executed every-so-often. 

Today, we'll check out the various ways to schedule data pipelines in Airflow: 

- Cron
- Timedelta
- Dataset
- Timetable

Let's go!

## Basics of Scheduling
Every Airflow DAG needs a minimum of three things: an ID, a start date, and a schedule to re-run the DAG. In our example, our DAG is going to run every day at midnight after 1/1/25: 

```python
from datetime import datetime
from airflow import DAG

with DAG(
    dag_id="my_amazing_dag",
    start_date=datetime(2025, 1, 1),
    schedule="@daily",
):
    # do something amazing here
```

The actual time a DAG runs can be can be confusing. Say you set a `start_date` of 2025-01-01 with a daily schedule. 

You may think the first run will be on 2025-01-01 at 12:00 AM. 

But the first run will actually be on 2025-01-**02** at 12:00AM, or one day after the start date. 

Airflow uses a concept called "data interval" where each DAG run is designed to process data associated with a certain time window. In Airflow, the first run of a DAG occurs at `start_date + schedule`, or when the first time window has closed. 

[insert diagram showing time intervals]

Keeping this concept in mind can save you a headache as you plan your DAG. With that nuance out of the way, let's move on to the different scheduling methods.

## Cron

Cron expressions can be used to schedule points in time you want the DAG to run. Here are some examples: 

- `30 5 * * *`: Everyday at 5:30am
- `0 14 * * 3`: Every Wednesday at 2:00pm (14:00)
- `5 2 1 8 *`: Every August 1 at 2:05am (02:05)

Cron expressions are made of 5 parts: minute, hour, day of month, month, and day-of-week. The asterisk can be used as a wild card to cover all values.

```text
* * * * *
| | | | |
| | | | day of the week (0–6) (Sunday to Saturday) 
| | | month (1–12)            
| | day of the month (1–31)
| hour (0–23)
minute (0–59)
```




- basic
- preset
- extensions: day of week hash, step values

## Timedelta
Scheduled-based cron expressions work great... until it doesn't. Mr. Client says, I need this report every 3 days. Uh... how do we do that in cron? You can't. 

This is where frequency-based scheduling comes into place. 

## Dataset
Mr. Client says, "I need this pipeline to report once our vendor-supplied file is processed, but that can vary." 
For such data dependencies with inconsistent deliveries, using Airflow's Dataset feature can help. 

## Timetable
eventsTimetable for set datetimes
custom timetable plugin for more complex times
