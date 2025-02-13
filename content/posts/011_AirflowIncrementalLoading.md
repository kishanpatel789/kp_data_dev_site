Title: Airflow Incremental Loading
Date: 2025-03-01
Slug: airflow-incremental-loading
Tags: airflow, data-engineering
Summary: Big data can be difficult data. Let's checkout how to design our Airflow pipelines to process data more efficiently. 
Status: draft


What exactly is incremental loading? Unlike moving a huge pile of data in one step, you break it down into each manageable chunks and process each chunk independenly. 

This is more efficient that processing the entire dataset. It saves more compute resources (which also leads to a lower cloud bill). And it may even shave off some calories. 

Airflow features a concept of a data interval. The idea is that each time you run a DAG, the run should process data associated with a certain interval of time. Airflow provides certain [template variables](https://airflow.apache.org/docs/apache-airflow/stable/templates-ref.html#variables) to help build such time-focused DAGs. The most important variables are the `data_interval_start` and `data_interval_end`. 

[ INSERT LINE DIAGRAM OF TIME AND DATA INTERVALS ]

Enough theory, let's make this real. Suppose we have an app that sells donuts online. We're going to build a pipeline that pulls donut orders from the app's API. Then we'll aggregate the data to see how many donuts we're selling each hour. 

Let's check out an example dag that processes donut orders. You heard me. The people want donuts. And there's an online app that sells them. 

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