Title: Mental Math Drill
Date: 2024-08-12
Slug: mental-math-drill
Tags: automation, python
Summary: Sharpen your mind with a daily email of math problems. 
Status: draft
MetaImage: None

Two things are true in life: Your email is filled with junk and your mental math stinks. 

Most email is noise. Go through your inbox. Count how many messages are marketing ads. How many are newsletters you haven't read in several weeks? This clutter distracts you and slows you down. What would a worthwhile email look like? One that sharpens your mind and helps your day-to-day life? 

How about one that tests your noggin with good ole' arithmetic? Adding, subtracting, multiplying, dividing. The lessons you learn in 1st grade are the some of the most important ones. But in an age of calculators and automation, our basic math skills atrophy when we become adults. We pull out our phones to do a quick calculation. If we're brave enough, we attempt to do some mental math, stumble while carrying the 1, and just give up. 

Like exercise or learning a new language, mental math takes practice. The longer you go without practicing, the worse you'll be. 

I recognized this flaw in myself. I am formally trained in advanced calculus and numerical analysis. But my basic arithmetic skills suck. Somewhere along the way, I outsourced adding and subtracting in my head to calculators. I spent more time studying theoretical concepts like the mean value theorem or the finer points of gradient descent. But the math concepts that I really need in life (to budget my finances, plan a party, or determine if I have enough underwear for the week) require basic arithmetic. 

After de-cluttering my email inbox, I filled the void with wholesome content that would make me better. I wrote a script that pitches me 5 math problems every morning at 6:05 AM. Each morning, I open my inbox and make this 5-problem drill the first thing I tackle. Here's how I did it. If you're a developer, you can use the code to set up your own drill. Who knows... if there's interest, I'll set up an email subscription so anyone can sign up without needing to be a developer. 

<img alt="Math drill email screenshot" src="/static/images/post004/EmailSample.jpeg" class="w-full md:w-auto md:max-w-xl mx-auto">


## Architecture
Here's what we're using. AWS is the cloud solution. AWS Lambda runs a python script that creates 5 problems and generates an email. Lambda passes the email content to AWS SES for distribution. AWS EventBridge Scheduler invokes the Lambda function on a recurring basis. All of this infrastructure is defined in code. You know me; my favorite way to spell I-a-C is T-e-r-r-a-f-o-r-m.

<img alt="Architecture diagram" src="/static/images/post004/MentalMathDrillArch.jpeg" class="w-full sm:w-auto sm:max-w-md mx-auto">

Let's dig deeper. Our Lambda function has two main components: the code and the dependencies. The code is a couple of python modules and some template files for generating the email. These files are archived into a .zip file. We need dependencies because some required packages (Jinja 2.0) are not part of the standard Lambda python 3.10 runtime. These dependencies are archived into a second .zip file and uploaded to AWS as a Lambda Layer. Don't worry; our Terraform configuration handles the zipping and uploading of both the code and dependencies for you. 

Next, Terraform sets up an EventBridge Scheduler to invoke the Lambda function. A cron expression defines when the email is sent. I've set my schedule as Monday to Saturday at 6:05 AM CDT (`5 11 ? * 2-7 *` in UTC). You can modify the schedule by adjusting the Terraform variables. 

Before EventBridge, Lambda, and SES can talk to each other, we need two IAM roles &mdash; the Lambda execution role and the EventBridge execution role. The Lambda role gives the function permission to call the SES service. The EventBridge role lets the Scheduler to invoke the Lambda function. Again, Terraform creates IAM roles for you so you don't have to be the responsible parent keeping track of who your AWS services are dating. 

## Set Up
Have I piqued your interest yet? Let's get you up and running. 

Before you execute the Terraform configuration files, you need to do some setup in SES. If you haven't already, activate SES for your AWS account. Then enter the domain or email address you'll send emails from. Before you can send emails, you need to verify that you actually own the domain or email address you're sending from. (Sorry, you can't spoof an email from mark.zuckerburg@facebook.com.) Walk through this [AWS guide](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html) for more info. 
SES features a sandbox environment that allows you to send 200 emails a day. For me, that's enough. If you want to go all the way and productionize your email service, you'll need to request approval to move out of the SES sandbox. While in the sandbox, you also need to verify the email you're sending to. 

Next, get the code from this [Github repo](https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/mental_math_drill). Here's the lay of the land: 

```bash
├── requirements.txt
├── src
│   ├── greeting.py
│   ├── main.py
│   ├── problem.py
│   └── templates
│       ├── template.html
│       └── template.txt
└── terraform
    ├── main.tf
    ├── modules
    │   └── aws
    │       ├── main.tf
    │       ├── outputs.tf
    │       └── variables.tf
    ├── outputs.tf
    └── variables.tf
```

The `src` directory contains the python scripts and templates that will ultimately be used by Lambda. The `terraform` directory is home to our [relevant IaC configuration](https://developer.hashicorp.com/terraform/language/modules/develop/structure). 

Before we create resources in AWS, we need to prepare python dependencies for the Lambda Layer. Execute the following commands in the project's root directory to create a virtual environment using python 3.10: 

```bash
python3.10 -m venv venv
pip install -r requirements.txt
```

Almost there. Now we need to tell Terraform what email address we're sending from and where we want to send the email. In the `terraform` directory, create a file called `terraform.tfvars` and define two variables:

```
# terraform.tfvars
aws_email_sender    = "<sender-email-address>"
aws_email_recipient = "<recipient-email-address>"
```

You can add additional variables if you want to override other default values, like the number of problems or types of problems. Skim through the `variables.tf` file in the root Terraform module to see available variables. These variables will eventually be passed to the Lambda function as environment variables at runtime. 

Time to deploy! Execute the following commands in the `terraform` directory to create resources in AWS. As always, carefully review the prompt after the `apply` command to see what Terraform will attempt to create. Terraform will use your default [AWS CLI profile](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#authentication-and-configuration) to build in your AWS account. 

```
terraform init
terraform apply
```

Peek into AWS console to witness your new email generator. If you want to test things, you can manually create a new EventBridge Scheduler with a one-time call of the Lambda function about 5 minutes from now... Or just go to bed and wait like a kid before Christmas morning. Your present should arrive around 6:05 AM CDT. 

![Lambda console after TF](/static/images/post004/LambdaConsole.jpeg)

---

Ta-daaah! You're all set to be quizzed. Go exercise your brain with these math drills. Like your mom always said, [you'll thank me](https://kpdata.dev) when you're older. 
