Title: Airflow Incremental Loading
Date: 2025-03-01
Slug: airflow-incremental-loading
Tags: airflow, data-engineering
Summary: Big data can be difficult data. Design your Airflow pipelines to process data more efficiently with incremental loading.
Status: draft

I feel amazing. 

I just ran a pipeline that processed 500 terabytes of data. For you non-nerds, 500 terabytes covers 166 million selfies. That's enough to take one selfie every minute for the next 317 years, which honestly is a level of vanity we should be concerned about. 

Anyway... the pipeline took 23 hours to run and a fair bit of stress. But it is done. And I am finished.

*Ding*

Mr. Client says, "Hey, remember that huge data source you processed? Turns out the data for one date was corrupted at the source. We need to re-run the ingestion pipeline."

Oh fiddlesticks. 

Those 500 terabytes represent several years of customer orders. Should I re-process ALL historic data if only a single day's data need to be refreshed? 

Nope. I'm a data engineer. I'll just use incremental loading. 

## What is incremental loading?
Incremental loading is the lazy man's way to get the minimum amount of work done. Instead of moving a huge pile of data in one step, you break it down into manageable chunks. Then you process each chunk independently in separate job runs. 

For time-based data, incremental loading means each job run handles data tied to a small window of time. The collection of each job run's results are stitched back together to show the full dataset (with any transformations you made).

For capturing changes in upstream data, incremental loading means you grab only the data that changed and ignore the data that stayed the same. 

This is more efficient than processing the entire dataset over and over again. It uses less compute resources, which leads to a lower cloud bill. Who knows, it may even lower your cholesterol. 

## How do I do this in Airflow?
[Airflow](https://airflow.apache.org/) features a concept called "data interval". The idea is that each time you run a DAG, the job run should process data associated with a certain interval of time. Airflow offers [template variables](https://airflow.apache.org/docs/apache-airflow/stable/templates-ref.html#variables) to build such time-focused DAGs. The most important variables are `data_interval_start` and `data_interval_end`. 

Every time a DAG runs, Airflow loads these two variables with what's perhaps obvious: the datetime values of the start and end of the data interval. 

For example, if we have a DAG running daily after 2/1/2025, then Airflow's data intervals would break the timeline into 24-hour chunks: 

![Data intervals](/static/images/post011/DataIntervals.jpeg)

The first interval would close on 2/2/25 at midnight (00:00), at which point the DAG will execute for the first time with a `data_interval_start` of `2025-02-01 00:00:00` and a `data_interval_end` of `2025-02-02 00:00:00`. The logic within the DAG can use these variables to filter the source data to the time interval we care about. 

## Uh... can I have an example?
Enough theory, let's make this real. We have an app that sells donuts. &#127849 &#129316

Our pipeline processes donut orders. Each day, we pull donut orders from the app's API. Then we summarize the data to see how many donuts are sold each hour. 

<img alt="DAG design" src="/static/images/post011/DAGDesign.jpeg" class="w-full my-2 md:w-auto md:max-w-2xl mx-auto">

The pipeline has two steps:

1. `get_orders`: We pull orders from the API and save them to our local computer. The API returns orders as a JSON object, so we save the data in this raw format. 
2. `process_orders`: We read the saved JSON orders and aggregate them to get the number of donuts sold each hour. Then we save the hourly summary as a CSV file on the local computer. 

Here's the key decision in our design: we will not grab ALL orders each time we run the DAG. Instead, we'll just get one day's orders with each DAG run. After all, why do we need to pull donut orders from a few days ago if we already have them from a previous DAG run? If this pipeline runs daily, then each morning we just need to grab the orders from yesterday. 

Conveniently, the API allows [query parameters](https://en.wikipedia.org/wiki/Query_string) `start_date` and `end_date`. That means we can ask the API to give us orders made between two dates. For example, hitting the API at the endpoint <code>http://orders_api:8000/orders?<b>start_date=2025-02-01</b>&<b>end_date=2025-02-02</b></code> returns orders placed between 2/1/25 at midnight and 2/2/25 at midnight (i.e. the day of 2/1). 

How do we write our DAG to capture one day's worth of data? Remember, we use the template variables `data_interval_start` and `data_interval_end`, which are supplied for each DAG run. 

Here's our DAG with two tasks: 

```python
from datetime import datetime
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonVirtualenvOperator
from src.process_donut_orders import calculate_hourly_stats

with DAG(
    dag_id="002_process_donut_orders",
    start_date=datetime(2025, 2, 1),
    schedule="@daily",
):

    get_orders = BashOperator(
        task_id="get_orders",
        bash_command=(
            "curl -sSo $AIRFLOW_HOME/data/orders/{{ data_interval_start | ds }}.json "  # define output json file
            "'http://orders_api:8000/orders?"
            "start_date={{ data_interval_start | ds }}&"  # give api start_date
            "end_date={{ data_interval_end | ds }}'"  # give api end_date
        ),
    )

    process_orders = PythonVirtualenvOperator(
        task_id="process_orders",
        python_callable=calculate_hourly_stats,
        requirements=["polars==1.21.0"],
        system_site_packages=True,
        templates_dict={"file_name": "{{ data_interval_start | ds }}"}, # give file name of json and csv files
    )

    get_orders >> process_orders
```

In the 1st task, we use a [curl command](https://curl.se/) to hit the API. The URL includes `data_interval_start` and `data_interval_end` templated by curly braces (`{{ }}`). This injects the template variables into the API endpoint URL: `http://orders_api:8000/orders?start_date={{ data_interval_start | ds }}&end_date={{ data_interval_end | ds }}`. 

We also include a template variable in the `-o` flag to save the API results to a file; the file name matches the start of the data interval: `$AIRFLOW_HOME/data/orders/{{ data_interval_start | ds }}.json`.

Side note: That `| ds` at the end of our template just converts the `datetime` object into a string like "YYYY-MM-DD". This is a [Jinja filter that Airflow provides](https://airflow.apache.org/docs/apache-airflow/stable/templates-ref.html#filters). 

In the 2nd task, we use `data_interval_start` again to target JSON and CSV files by their name. This is used internally in the [python function `calculate_hourly_stats`](https://github.com/kishanpatel789/kp_data_dev_blog_repos/blob/main/airflow_incremental_loading/dags/src/process_donut_orders.py#L1) to identify which JSON file to read and which CSV file to write. 

All together, this DAG stores a single day's worth of donut orders as a JSON file (e.g. `2025-02-01.json`) and summarizes them into a CSV file (e.g. `2025-02-01.csv`). 

If Mr. Client says we need to refresh data for a certain day, we just re-run the DAG run for that day. This would capture only the orders we need to re-process instead of the whole dataset. 

---

Phew! Incremental loading efficiently handles time-based data or re-processes a subset of your data. It just takes a bit of foresight to design your pipelines with this strategy.

You can play around with the donut API and example DAG at this [Github repo folder](https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/airflow_incremental_loading). Use the README to get set up. 

Do you want help making your data pipelines more efficient and cost effective? Then stop taking that selfie and [call me](https://kpdata.dev/). 