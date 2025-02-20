Title: Airflow Incremental Loading
Date: 2025-03-01
Slug: airflow-incremental-loading
Tags: airflow, data-engineering
Summary: Big data can be difficult data. Let's checkout how to design our Airflow pipelines to process data more efficiently. 
Status: draft

I feel amazing. 

I just ran a pipeline that processed 500 terabytes of data. For you normal people, 500 terabytes is 166 million selfies. That's enough for you to take one selfie every minute for the next 317 years, which honestly is a level of vanity we should be concerned about. 

Anyway... the pipeline took about 23 hours and a fair amount of stress. But it is done. I'm finished.

*Ping*

Mr. Client says, "Hey, remember that huge data source you ingested into our warehouse. Turns out the data for one date was corrupted at the source. We need to re-run the ingestion pipeline."

Oh fiddlesticks. 

Those 500 terabytes represent several years of customer orders. Should I re-process ALL historic data if only a single day's data needs to be refreshed? 

Nope. I'm a data engineer. I'll just use incremental loading. 


## What is incremental loading?
Incremental loading is the lazy man's way to get the minimum amount of work done and no more. Unlike moving a huge pile of data in one step, you break it down into manageable chunks. Then you process each chunk independently in separate job runs. 

For time-based data, incremental loading means each job run handles data tied to a small window of time. The collection of each job run's results are stitched back together to show the full dataset (with any transformations you made).

For capturing changes in upstream data, incremental loading means you grab only the data that changed and ignore the data that stayed the same. 

This is more efficient than processing the entire dataset over and over again. It uses less compute resources, which leads to a lower cloud bill. Who knows, it may even lower your cholesterol. 

## How do I do this in Airflow?
Airflow features a concept of a data interval. The idea is that each time you run a DAG, the run should process data associated with a certain interval of time. Airflow provides [template variables](https://airflow.apache.org/docs/apache-airflow/stable/templates-ref.html#variables) to help build such time-focused DAGs. The most important variables are the `data_interval_start` and `data_interval_end`. 

Every time a DAG runs, these two variables are loaded with what's probably obvious: the datetime values representing the start and end of the interval. 

For example, if we have a DAG designed to run daily after 2/1/2025, then the data intervals would break up time into 24-hour chunks: 

![Data intervals](/static/images/post011/DataIntervals.jpeg)

The first interval would close on 2/2/25 at midnight (00:00), at which point the DAG will execute for the first time with a `data_interval_start` of `2025-02-01 00:00:00` and a `data_interval_end` of `2025-02-02 00:00:00`. The logic within the DAG can then use these variables to filter the source data to the time interval we care about for that run. 

## Uh... can I have an example?
Enough theory, let's make this real. We have an app that sells donuts online. &#127849 &#129316

We're building a pipeline that processes donut orders. We'll pull donut orders from the app's API. Then we'll aggregate the data to see how many donuts we're selling each hour. 


[INSERT FLOW CHART OF DAG]

The API returns orders as a JSON object. We'll save our aggregated hourly summary as CSV files. 

Here's the key decision point in our design: we're not going to grab all orders each time we run the DAG. We'll just get one day's worth at a time. After all, why do I need to pull donut orders from a couple of days ago if I already have them from a previous DAG run?


Conveniently, the API features query parameters `start_date` and `end_date` so we can filter the output for the days we're interested in instead of getting all orders every made through the app. 

[ insert json sample ]
[ insert csv sample? ]

```python
with DAG(
    dag_id="002_process_donut_orders",
    start_date=datetime(2025, 2, 1),
    schedule="@daily",
    max_active_runs=4,
    catchup=True,
):

    get_orders = BashOperator(
        task_id="get_orders",
        bash_command=(
            "mkdir -p $AIRFLOW_HOME/data/orders && "
            "curl -sSo $AIRFLOW_HOME/data/orders/{{ data_interval_start | ds }}.json "
            "'http://orders_api:5000/orders?"
            "start_date={{ data_interval_start | ds }}&"
            "end_date={{ data_interval_end | ds }}'"
        ),
    )

    process_orders = PythonVirtualenvOperator(
        task_id="process_orders",
        python_callable=calculate_hourly_stats,
        requirements=["polars==1.21.0"],
        system_site_packages=True,
        templates_dict={"file_name": "{{ data_interval_start | ds }}"},
    )

    get_orders >> process_orders
```

Note how we're using the `data_interval_start` and `data_interval_end` in the curl command, templated with `{{ }}`. We use `data_interval_start` again in the 2nd task to identify the file name of the JSON and CSV files. Given that the schedule is `@daily`, this means that the start and end dates will bookend a single 24 hour period. 

---

Do you need help making your data pipelines more efficient and cost effective? Then stop taking that selfie and [call me](https://kpdata.dev/). 