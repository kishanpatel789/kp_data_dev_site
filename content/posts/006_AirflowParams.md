Title: Airflow Params
Date: 2024-10-10
Slug: airflow-params
Tags: airflow, data-engineering
Summary: Want to make friends? Design your Airflow DAGs with Params. Your co-workers (or you 6 months from now) will thank you.
Status: published
MetaImage: /static/images/post006/ConfusedDeveloper.jpeg

I sit down in my cubicle and start my computer. It's Monday morning. 

*Ding.* In comes a request to test some python script with [Airflow](https://airflow.apache.org/). 

"Okay...", I think, why not? I have a ton of other tasks to complete, but I'm a decent engineer. This won't take long. I pull up the Airflow DAG and hit "trigger with config" to find this: 

<img alt="Initial DAG config" src="/static/images/post006/InitialConfig.jpeg" class="w-full md:w-auto md:max-w-xl mx-auto">

What the heck is this? How do I tell the DAG which python script to run? Does it need to know anything else? 

I lean back in my chair and take a breath. It's 8:30 now. This pipeline can't be that complicated. It just runs scripts with a service account. The python script I need to test is somewhere in a S3 bucket. I'll just throw different config objects at the DAG until it runs. Then I'll move on to my task list.

Several minutes later, my screen is bleeding red with failed DAG runs.

<img alt="Initial DAG config" src="/static/images/post006/BleedingDag.jpeg" class="w-full md:w-auto md:max-w-2xl mx-auto">

I slowly realize I'm not going to finish this before lunch. Worse, I realize I need to pop the hood and look at the code behind the DAG. Of course, there's no documentation for this pipeline. I need to figure out how someone designed the DAG to run. 

I study the code like that guy with a metal detector on the beach every weekend. I'm desperate. My eyes scan through lines of code, looking for the proper input the DAG needs. 

Finally, I build a DAG config that successfully tests the python script. I shoot off a response to the guy who sent the request. I'm done. 

![First Successful DAG Run](/static/images/post006/FirstDagSuccess.jpeg)

I swivel the chair around and look out the window. I'm happy I found a solution. But I'm also mad. 

It shouldn't be this way. I shouldn't have to dig through someone else's code just to know how to use it. There has to be another way, a better way. I swivel the chair back to my computer and search through the Airflow docs. I'm still desperate, but now I'm hunting for something that will keep me from reliving a morning like this. 

And then I find my treasure...

I open a new file. My fingers dance across the keyboard. An hour later, I have a DAG that looks like this: 

<img alt="Better DAG UI" src="/static/images/post006/BetterDagUI.jpeg" class="mx-auto">

Two DAGs. Both do the same thing. But one is helpful, like the family member you actually want to see over the holidays. What makes the difference? [Airflow Params](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/params.html). 

---

Params let you pass runtime configuration to a DAG. That's a fancy of way of saying, "When you run a DAG manually, use Params to make the final tweaks." Airflow takes any Params written in a DAG file and magically generates a web form, which handles basic input validation. But what's most helpful is the ability to add descriptions or hints for each expected input. 

Here's a snippet of how Params are defined in my better DAG: 

```python
# 02_better_dag.py
# ...
from airflow.models.param import Param
params = {
    "python_file_path": Param(
        "",
        description="Enter the path to the python file. Should be in format of 's3://<bucket-name>/<path-to-file>.py'",
        type="string",
        minLength=0,
    ),
    "extra_packages": Param(
        [],
        description=f"Enter any additional python packages required for the python file. Each package should be entered on a separate line without quotation.\nStandard packages: {STANDARD_PACKAGES}",
        type="array",
        items={"type": "string"},
    ),
    "kw_args": Param(
        {},
        description="Enter any arguments needed by the python file's main() function as key-value pairs. Input should be a python dictionary that passes JSON parsing",
        type="object",
    ),
    "system_site_packages": Param(
        True,
        description="Inherit packages from global site-packages directory",
        type="boolean",
    ),
}
# ...
```

Notice how the code translates to the generated UI. This DAG uses inputs like strings, arrays, objects, and booleans. The [Airflow docs](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/params.html) show the full range of data types available. 

Beyond Params, you can create documentation for the DAG using the `doc_md` argument. The argument takes Markdown content and renders it as HTML when you pull up the DAG in the UI. 

```python
# 02_better_dag.py
with DAG(
    dag_id="02_better_dag",
    schedule="0 0 * * *",
    start_date=pendulum.datetime(2024, 9, 1, tz="UTC"),
    catchup=False,

    doc_md=textwrap.dedent("""
        # Super Cool Python Runner
        - This dag runs a python file and should be executed with run-time configuration.
        - The target python file must be located in AWS S3 and contain a `main()` function.
    """),
    # ^^^ Talk about your DAG here!

) as dag:
    # task definitions below...
```

Check out the entire [code behind both DAGs](https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/airflow_params/airflow/dags). 

If you want to meet the DAGs in real life, clone the [full project folder](https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/airflow_params). Use the README to get set up. Terraform will take care of your AWS resources. Docker will run your local Airflow instance. 

---

Friends don't let [friends](https://kpdata.dev) DAG blindly. The next time you're building an Airflow pipeline, consider using Params with helpful documentation. Someone will thank you for your effort; it may even be you 6 months from now. 