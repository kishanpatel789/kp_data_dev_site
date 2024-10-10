Title: Airflow Params
Date: 2024-10-10
Slug: airflow-params
Tags: airflow, data-engineering
Summary: Friends don't let friends DAG blindly. Design your Airflow DAGs with helpful Params. Your co-workers (or you 6 months from now) will thank you.
Status: draft

I sit down in my cubicle and start my computer. It's Monday morning. *Ping.* In comes a request to test some python script using Airflow. "Okay...", I think, why not? I have a ton of other tasks to complete, but I'm a decent engineer. This won't take long. I pull up the Airflow DAG and hit "trigger with config" to find this: 

```
{}
```

What the heck is this? How do I tell it which python script to run? Does the DAG need to know anything else? I lean back in my chair and take a breath. It's 8:30 now. This DAG can't be that complicated. It just test runs python scripts with a service account. The python script I need to test is somewhere in a S3 bucket. I'll just throw different config objects at it until the DAG runs. Then I'll move on to my task list.

Several minutes later, my screen is bleeding red with failed DAG runs.

[INSERT SCREENSHOT OF FAILED RUNS]

I slowly realize I'm not going to finish this before lunch. Worse, I realize I need to pop the hood and study the code behind the DAG. Of course, there's no documentation for this pipeline. I need to figure out how someone designed the DAG to run. 

I study the code like that guy with a metal detector on the beach every weekend. I'm desperate. My eyes scan through lines of code, looking for the proper input the DAG needs. 

Finally, I build a dag_config that successfully tests the python script. I shoot off a response to the guy who sent the request. I'm done. 

[INSERT SCREENSHOT OF MULTIPLE FAILED RUNS AND ONE SUCCESSFUL RUN]

I swivel the chair around and look out the window. I'm happy I found a solution. But I'm also mad. It shouldn't be this way. I shouldn't have to dig through someone else's code just to see how to run a DAG. There has to be another way, a better way. I swivel the chair back to my computer and scour through the Airflow docs. I'm still desperate, but now I'm hunting for something that will keep me from reliving a morning like this. 

And then I find my treasure. 

Two hours later, I'm holding a DAG that went from this...

[insert simple dag screenshot]

to this...

[insert better dag screenshot]

I have two DAGS. Both do the same thing. But one is helpful like the family member you actually want to see over the holidays. What's the difference? Airflow Params. 

---

Params are a feature in Airflow for passing one-time configuration for each DAG run, perfect for a DAG that's supposed to test some python script living in the cloud. When defining Params in a DAG file, the Airflow UI magically generates a helpful UI and gives some basic form validation. But what's most helpful is the ability to add descriptions and helpful messages for each input. 

Here's a snapshot of the Params definition in my better DAG: 

[INSERT PYTHON CODE DEFINING PARAMS]

Notice how the python code translates into the UI. Also, you can define documentation for the DAG in markdown, which is then rendered when you pull up the DAG. 

Check out the full code behind both DAGs here: [insert repo link]



Auto-generated ui, form validation, include helpful messages
also use dag docs

