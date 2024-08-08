Title: Mental Math Drill
Date: 2024-08-12
Slug: mental-math-drill
Tags: automation
Summary: Sharpen your mind with a daily email of math problems. 
Status: draft
MetaImage: None

Two things are true in life: Your email is filled with junk and your mental math stinks. 

Most email is noise. Go through your inbox. Count how many messages are marketing ads. How many are newsletters you haven't read in several weeks? This clutter distracts you and slows you down. What would a worthwhile email look like? One that sharpens your mind and helps your day-to-day life? 

How about one that tests your noggin with good ole' arithmetic? Adding, subtracting, multiplying, dividing. The lessons you learn in 1st grade are the some of the most important ones. But in an age of calculators and automation, our basic math skills atrophy when we become adults. We pull out our phones to do a quick calculation. If we're brave enough, we attempt to do some mental math, stumble when carrying the 1, and just give up. 

Like exercise or learning a new language, mental math takes practice. The longer you go without practicing, the worse you'll be. 

I recognized this flaw in myself. I am formally trained in advanced calculus and numerical analysis. But my basic arithmetic skills suck. Somewhere along the way, I outsourced adding and subtracting in my head to calculators. I spent more time studying theoretical concepts like the mean value theorem or the finer points of gradient descent. But the math concepts that I really need in life (to budget my finances, plan a party, or determine if I have enough underwear for the week) require basic arithmetic. Besides all this, doing math in your head can make you more confident and faster at decision making.

After de-cluttering my email inbox, I filled the void with wholesome content that would make me better. I created a simple script that pitches me 5 arithmetic problems every morning at 6:05 AM. Each morning, I open my inbox and make these 5 problems the first thing I tackle in my workday. Here's how I did it. If you're a developer, you can use the code to set up your own drill. Who knows... if there's interest, maybe I'll set up an email subscription so anyone can subscribe to the drill without needing to know cloud infrastructure. 

## Architecture
Here's what we're using. AWS is the cloud solution. AWS Lambda executes a python script to create 5 problems and generates an email. Then the functions sends the email to AWS SES for distribution. An AWS EventBridge scheduler invokes the Lambda function on a recurring basis. All of this infrastructure is defined in code. You know me. My favorite way to spell I-a-C is T-e-r-r-a-f-o-r-m.

[INSERT ARCHITECTURE DIAGRAM]

Let's dig deeper. This time, we create two IAM roles -- one for the lambda execution role and another for the cloudwatch schedule. The lambda execution role gives the function permission to send an email to the SES service. The EventBridge  role gives permission to the scheduler to invoke the lambda function. 

Regarding, the Lambda service, there are two main components: the code and the dependencies. The code consists of a couple of python modules and some template files for generating the email. These files are archived into a single .zip file. The dependencies are specific python packages that are not part of the standard Lambda python 3.10 runtime. In particular, Jinja 2.0 is needed for our project and not standard in teh Lambda runtime. These dependencies can also be archived into a .zip file and uploaded to AWS as a Lambda Layer. Don't worry; this Terraform configuration handles the zipping and uploading of both the code and dependencies for you. 

Next, Terraform sets up an Eventbridge schedule to invoke the lambda function. A simple cron expression can be used to send the email when you want. I've defaulted to Monday to Saturday at 6:05am.  You can modify the scheduled time by adjusting the Terraform variables. 

## Set Up
Before you execute the Terraform configuration files, you'll need to do a bit of set up in SES, especially if you haven't used the service before. First, activate SES for your AWS account. Then enter a domain or individual email address that you will send emails from. Before you can actually send emails, you'll need to verify that you actually own the domain or email address.  Walk through this guide: [INSERT AWS LINK]
SES features a sandbox environment that allows you to send 200 emails a day. For me, this is all I need. If you want to go all the way and productionize your email service, you'll need to request approval to move out of the SES sandbox. While in the sandbox, you also need to verify the email you're sending to. 

Get the code from this repo. Here's the lay of the land:  [ENTER DIRECTORY TREE]

Create a python virtual env - needed to load lambda layer
`python3.10 -m venv venv`
`pip install -r requirements.txt`

In the `terraform` directory, create a file called `terraform.tfvars` and enter the following values:

```
# terraform.tfvars
aws_email_sender    = "<sender-email-address>"
aws_email_recipient = "<recipient-email-address>"
```

You can add additional variables if you want to override other default values, like the number of problems or types of problems. Peruse the `variables.tf` file in the root terraform module to see available variables. These variables will eventually be passed to teh Lambda function as environment variables. 


Execute `terraform init` in the `terraform` directory. 
Execute `terraform apply`. Peek into AWS console to see the creation of your new email generator. If you want to test the setup, you can create a new eventbridge schedule with a one-time fire for 5 minutes from now. 

[INSERT SCREENSHOT OF EMAIL, AWS resources]

---

There ya go! You're all set to be quizzed. Go workout your largest muscle (your brain) with these math drills.  Like your mom always said, [you'll thank me](https://kpdata.dev) when you're older. 


