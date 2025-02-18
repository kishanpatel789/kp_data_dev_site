Title: Airflow Incremental Loading
Date: 2025-03-01
Slug: airflow-incremental-loading
Tags: airflow, data-engineering
Summary: Big data can be difficult data. Let's checkout how to design our Airflow pipelines to process data more efficiently. 
Status: draft

## Intro
I feel amazing. 

I just ran a pipeline that processed over 14 petabytes of data. It took about 23 hours and a fair amount of stress. But it is done. 

*ping*

Mr. Client says, "Hey, remember that huge data source you ingested into our warehouse. Turns out the data for a one date was corrupted at the source. We need to re-run the ingestion."

Oh fiddlesticks. 

Do I really want to re-run ALL historic data if only a single day's data needs to be refreshed? 

Of course not. But I'm a data engineer. I'll just use incremental loading. 


## What is incremental loading
Incremental loading is the lazy-man's way to get the minimum amount of work done and no more. Unlike moving a huge pile of data in one step, you break it down into each manageable chunks and process each chunk independenly. 

In the context of capturing changes in upstream data, incremental loading allows you to process only the data that changed, and nothing else. 

This is more efficient that processing the entire dataset. It saves more compute resources (which also leads to a lower cloud bill). And it may even shave off a few calories. 

## Data interval
Airflow features a concept of a data interval. The idea is that each time you run a DAG, the run should process data associated with a certain interval of time. Airflow provides [template variables](https://airflow.apache.org/docs/apache-airflow/stable/templates-ref.html#variables) to help build such time-focused DAGs. The most important variables are the `data_interval_start` and `data_interval_end`. 

[ INSERT LINE DIAGRAM OF TIME AND DATA INTERVALS ]

For example, in our first data interval, 

## Example dag
Enough theory, let's make this real. We have an app that sells donuts online. We're building a pipeline that processes donut orders. We'll pull donut orders from the app's API. Then we'll aggregate the data to see how many donuts we're selling each hour. 


[INSERT FLOW CHART OF DAG]

We API returns orders as a JSON object. We'll save our aggregated hourly summary as CSV files. 

Here's the key decision point in our design: we're not going to grab all orders each time we run the DAG. We'll just get one day's worth at a time. 

[ insert json sample ]
[ insert csv sample? ]

Conveniently, the API features query parameters `start_date` and `end_date` so we can filter the output for the days we're interested in instead of getting all orders every made through the app. 

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