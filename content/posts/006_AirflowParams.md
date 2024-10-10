Title: Airflow Params
Date: 2024-10-10
Slug: airflow-params
Tags: airflow, data-engineering
Summary: Want to make friends? Design your Airflow DAGs with Params. Your co-workers (or you 6 months from now) will thank you.
Status: draft

I sit down in my cubicle and start my computer. It's Monday morning. 

*Ding.* In comes a request to test some python script using Airflow. 

"Okay...", I think, why not? I have a ton of other tasks to complete, but I'm a decent engineer. This won't take long. I pull up the [Airflow](https://airflow.apache.org/) DAG and hit "trigger with config" to find this: 

<img alt="Initial DAG config" src="/static/images/post006/InitialConfig.jpeg" class="w-full md:w-auto md:max-w-xl mx-auto">


What the heck is this? How do I tell it which python script to run? Does the DAG need to know anything else? I lean back in my chair and take a breath. It's 8:30 now. This DAG can't be that complicated. It just test runs python scripts with a service account. The python script I need to test is somewhere in a S3 bucket. I'll just throw different config objects at it until the DAG runs. Then I'll move on to my task list.

Several minutes later, my screen is bleeding red with failed DAG runs.

<img alt="Initial DAG config" src="/static/images/post006/BleedingDag.jpeg" class="w-full md:w-auto md:max-w-2xl mx-auto">

I slowly realize I'm not going to finish this before lunch. Worse, I realize I need to pop the hood and study the code behind the DAG. Of course, there's no documentation for this pipeline. I need to figure out how someone designed the DAG to run. 

I study the code like that guy with a metal detector on the beach every weekend. I'm desperate. My eyes scan through lines of code, looking for the proper input the DAG needs. 

Finally, I build a DAG config that successfully tests the python script. I shoot off a response to the guy who sent the request. I'm done. 

![First Successful DAG Run](/static/images/post006/FirstDagSuccess.jpeg)

I swivel the chair around and look out the window. I'm happy I found a solution. But I'm also mad. 

It shouldn't be this way. I shouldn't have to dig through someone else's code just to see how to run a DAG. There has to be another way, a better way. I swivel the chair back to my computer and search through the Airflow docs. I'm still desperate, but now I'm hunting for something that will keep me from reliving a morning like this. 

And then I find my treasure. 

An hour later, I have a DAG that looks like this: 

![Better DAG UI](/static/images/post006/BetterDagUI.jpeg)

Two DAGS. Both do the same thing. But one is helpful, like the family member you actually want to see over the holidays. What makes the difference? [Airflow Params](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/params.html). 

---

Params let you pass runtime configuration to a DAG, perfect for a DAG that's supposed to test some python script living in the cloud. When defining Params in a DAG file, Airflow magically generates a helpful UI and gives some basic form validation. But what's most helpful is the ability to add descriptions and helpful messages for each input. 

Here's a snapshot of the Params definition in my better DAG: 

```python
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
```

Notice how the python code translates into the UI. Also, you can define documentation for the DAG in markdown, which is then rendered when you pull up the DAG. 

Check out the full code behind both DAGs here: [insert repo link]

If you want to play around with the code, you can clone the fully repo here: 

Terraform will set up your AWS resources. Docker will set up your local Airflow instance. 

also use dag docs

---

Friends don't let friends DAG blindly. The next time you're building an Airflow pipeline, consider using Params with helpful documentation. Someone will thank you; it may even be you 6 months from now. 