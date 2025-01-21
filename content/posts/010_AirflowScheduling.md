Title: Airflow Scheduling
Date: 2025-02-01
Slug: airflow-scheduling
Tags: airflow, data-engineering
Summary: Enjoy life and let Airflow handle the boring stuff. We're talking about how you can schedule those tasks to run for you. 
Status: draft

Life is short. Way to short to do mundane tasks. 

So when Mr. Client says, "Hey, I need this report generated and sent to me every Friday at 9AM," I look for the option that does not sacrifice all Friday mornings for the rest of my life. (I have big dreams for my Friday mornings.)

[Airflow](https://airflow.apache.org/) orchestrates the tasks you need to execute. You tell the framework when you need the work done and how to do it, and like a helpful minion, it will get the job done. This is especially helpful when you have repetitive tasks that need to be executed every-so-often. 

Today, we'll check out the various ways to schedule data pipelines in Airflow. Let's go!

## Basics of Scheduling
Airflow creates intervals of time for each pipeline to run. Every Airflow DAG needs a minimum of three things: an ID, a start date, and a schedule to re-run the DAG. In our example, our DAG has a `start_date` of 1/1/25 (at midnight) and a `schedule` of "daily": 

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

When do you think the very first run of this DAG will occur? You may think the first run will be 1/1/25 at 12:00 AM. 

But the first run will actually be on 1/**2**/25 at 12:00AM, or one day after the start date. 

The actual time a DAG runs can be can be confusing. Airflow uses a concept called "data interval" where each DAG run is designed to process data associated with a certain time window. Typically, a DAG runs at the end of each data interval. In Airflow, the first run of a DAG occurs at `start_date + schedule`, or when the first time window has closed. 

[insert diagram showing time intervals]

Keeping this concept in mind can save you a headache as you plan your DAG. With that nuance out of the way, let's move on to the different scheduling methods. We're going to look at the various objects you can supply to the `schedule` parameter:

- Cron
- Timedelta
- Dataset
- Timetable

## Cron
[Cron expressions](https://en.wikipedia.org/wiki/Cron) can be used to schedule points in time you want the DAG to run. Here are some examples: 

- `30 5 * * *`: Everyday at 5:30AM
- `0 14 * * 3`: Every Wednesday at 2:00PM (14:00)
- `5 2 1 8 *`: Every August 1 at 2:05AM (02:05)

Cron expressions are made of 5 parts: minute, hour, day-of-month, month, and day-of-week. The asterisk can be used as a wild card to cover all values.

```text
┌── minute (0-59)
| ┌── hour (0-23)
| | ┌── day of the month (1-31)
| | | ┌── month (1-12)   
| | | | ┌── day of the week (0-6) (Sunday to Saturday) 
* * * * *
```

These expressions may be hard to understand at first. Tools like [crontab.guru](https://crontab.guru/) can help interpret cron expressions or create new ones.

Given that some cron expressions are used so frequently, Airflow features cron "presets" as an alternative. The following human-friendly preset values can be entered as the schedule in place of their cron equivalent: 

| Preset        | Meaning                                                    | Cron          |
| ------------- | ---------------------------------------------------------- | ------------- |
| `@once`       | Schedule once and only once                                |               |
| `@continuous` | Run as soon as the previous run finishes                   |               |
| `@hourly`     | Run once an hour at the end of the hour                    | `0 * * * *`   |
| `@daily`      | Run once a day at midnight                                 | `0 0 * * *`   |
| `@weekly`     | Run once a week at midnight on Sunday                      | `0 0 * * 0`   |
| `@monthly`    | Run once a month at midnight of the first day of the month | `0 0 1 * *`   |
| `@quarterly`  | Run once a quarter at midnight on the first day            | `0 0 1 */3 *` |
| `@yearly`     | Run once a year at midnight of January 1                   | `0 0 1 1 *`   |


If you need further customization, Airflow allows extended cron expressions: day-of-week hash and step values. 

The hash symbol (`#`) can be used in the day-of-week position to indicate which instance in a given month to run the DAG. For example, the expression `0 13 * * 5#2` means the 2nd Friday of the month (5#2) at 1:00PM (13:00). This modification can be useful when you need a pipeline to run monthly but only on a given day of the week. 

The division symbol (`/`) creates step values. For example, `*/10 * * * *` represents every 10 minutes. This is essentially a shortcut for the more verbose `0,10,20,30,40,50 * * * *`. 

## Timedelta
A cron expression works great... until it doesn't. Mr. Client says, "I need this report every 4 days." Uh... how do we schedule that in cron? You can't. 

Cron is stateless, meaning it does not keep track of the last time a job ran. It's a glorified pattern matching system that regularly compares the expression against the current time to see if the pipeline should run. 

You could try forcing a cron expression that represents every 4 days by hard-coding every 4th day (eg. 1st, 5th, 9th, 13th, ... of the month). But you'd have an issue at the end of the month; the DAG would run on the 29th of this month and the 1st of next month, which would break the every-4-days goal.

This is where frequency-based scheduling comes into place. Python's [timedelta object](https://docs.python.org/3/library/datetime.html#timedelta-objects) can be supplied to the `schedule` parameter to schedule DAGs at a regular frequency. 

```python
from datetime import datetime, timedelta
from airflow import DAG

with DAG(
    dag_id="my_frequency_based_dag",
    start_date=datetime(2025, 1, 1),
    schedule=timedelta(days=4),  # every 4 days after 1/1/25
):
    # do stuff
```

For example, `schedule = timedelta(days=4)` will execute the DAG every 4 days while `schedule = timedelta(minutes=17)` will run the DAG every 17 minutes.

## Dataset
Mr. Client says, "I need this report to run after our vendor-supplied file is processed. But the file is processed at different times, sometimes different days..."

Sometimes, you don't have a time-based schedule. Instead you have an event-driven one. 

Airflow has push-based models like the 
and pull-based frameworks like the external task sensor. But these can be a bit clunky. 

A relatively new feature in Airflow is the Dataset. 

For such data dependencies with inconsistent deliveries, using Airflow's Dataset feature can help. 

## Timetable
eventsTimetable for set datetimes
custom timetable plugin for more complex times

--- 

Grab the [code](https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/airflow_scheduling). 