Title: Snowflake with Terraform
Date: 2024-04-24
Slug: snowflake-with-terraform
Tags: cloud, terraform, snowflake
Summary: Cut down on your Snowflake project costs by managing cloud infrastructure with Terraform!
Status: draft

It's a lot of fun to develop a new project using a cloud platform like [Snowflake](https://www.snowflake.com/). You can quickly spin up databases and virtual compute with the click of a button to test new features. What's not fun is the unexpected bill that comes at the end of the month. When developing proof-of-concepts, these costs can be drastically reduced by simply destroying the resources created in Snowflake when you're not using them. Ideally, you could spend your day working in the cloud platform and at the end of the day, you could quickly tear down what you built to avoid storage and compute costs overnight. Even more ideally, you could re-provision your cloud resources the next day to continue your work. 

[Terraform](https://www.terraform.io/) is an Infrastructure-As-Code (IAC) solution for managing cloud resources. That's a fancy way of saying that you use programming to create stuff in the cloud instead of using the traditional click-and-type steps in a user interface or instead of using a custom API made available by the cloud provider. Terraform allows you to define the target state of your cloud resources and keeps a log of the current state. The Terraform executable then attempts to create, modify, and delete cloud resources to make the current state match the target state.  

On a recent data engineering project, I used Snowflake as a data warehouse. The setup included a database, three schemas and a service user that would be used to manage data objects within the database. Below is a brief description of how you can use Terraform to provision a basic data warehouse. 

## Setup

### 1. Create Snowflake Account
First thing's first: You need a Snowflake account. If you don't have one, you can create a free trial here: [https://signup.snowflake.com/](https://signup.snowflake.com/). 

Next, we need to identify a user in the Snowflake account that Terraform will impersonate when managing Snowflake resources. It's helpful for this user to have the `ACCOUNTADMIN` role. By default, the user that creates the Snowflake account should have the `ACCOUNTADMIN` role. 

For this tutorial, we can allow Terraform to authenticate in Snowflake via username and password. (Other methods of authentication can be found [here](https://registry.terraform.io/providers/Snowflake-Labs/snowflake/latest/docs#authentication)). On your local computer, create a configuration file `~/.snowflake/config` that contains Snowflake credentials for the user with the ACCOUNTADMIN role:

```toml
[default]
account='<snowflake-account-identifier>'
user='<user-name>'
password='<user-password>'
role='ACCOUNTADMIN'
```

Replace this template with the account identifier and user credentials in your scenario. Terraform will look use this "default" profile to connect to your Snowflake account. 

### 2. Install Terraform
Next, to use Terraform, you gotta get Terraform: [https://developer.hashicorp.com/terraform/install](https://developer.hashicorp.com/terraform/install)

Terraform is bundled as a compiled binary package that can run on your local machine. Download the package for your operating system. In practice, we'll use Terraform from a terminal, so the Terraform executable must be in your terminal's `PATH` variable. You can verify your installation was successful by running the command `terraform -help`. 

### 3. Download Repo
The code for this walkthrough can be downloaded from this [Github repo](https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/snowflake_with_terraform). We'll walk through the Terraform configuration within these files and modify variables as we go. 

## Explanation of Repo
Alright, let's talk about the Terraform configuration files. Here's the full directory of files: 

```bash
├── main.tf
├── outputs.tf
├── variables.tf
├── modules
│   └── snowflake
│       ├── main.tf
│       ├── outputs.tf
└       └── variables.tf
```

We'll first look at the files in the root directory and then look at the files in the `./modules/snowflake` subdirectory.

The [standard module structure](https://developer.hashicorp.com/terraform/language/modules/develop/structure) of Terraform has a root module containing three files: `main.tf`, `variables.tf`, and `outputs.tf`. The root directory's `main.tf` file serves as the entry point for the terraform configuration. It lists the required providers and modules that will be maintained by the repo. In this case, we define the snowflake provider sourced from `Snowflake-Labs/snowflake` and specify a local backend. The local backend simply states that the "status" of the current cloud resources is stored on your local machine. For small projects like this, you can keep store the current state on your local machine. For production environments, it's best to use Terraform Cloud to manage the current state, especially when collaborating with other developers.

```terraform
# main.tf
terraform {
  required_providers {
    snowflake = {
      source  = "Snowflake-Labs/snowflake"
      version = "~> 0.86"
    }
  }

  backend "local" {}
}

module "snowflake" {
  source = "./modules/snowflake"

  service_user_password = var.snowflake_service_user_password
}
```

The root `main.tf` file also lists modules that are loaded into the configuration. [Terraform modules](https://developer.hashicorp.com/terraform/language/modules) are a great way to group resources that are used together; they can be also be used to package and reuse Terraform configurations between projects. We have one module "snowflake" which expects a variable for the service user's password. The variable is passed to the Terraform executable at runtime as an environment variable to avoid committing the password to the code's repository. The declared in the `variables.tf` file. The password can be stored in the file `.env` with the prefix `TF_VAR_`. Terraform will read environment variables with this prefix and load them to any variables defined in the Terraform configuration files. 

```bash
# .env
export TF_VAR_snowflake_service_user_password=<enter-your-password>
```

Next, let's look at the files within the snowflake module. In `./modules/snowflake/variables.tf`, we define two variables: one variable stores the snowflake configuration profile name (with "default" as the default value); another variable stores the service user password. The module's `main.tf` file configures the provider to use this profile and then defines the cloud resources to provision. 

```terraform
# ./modules/snowflake/main.tf
terraform {
  required_providers {
    snowflake = {
      source  = "Snowflake-Labs/snowflake"
      version = "~> 0.86"
    }
  }
}

provider "snowflake" {
  profile = var.snowflake_profile
}

# ... cloud resources defined below ...
```

Let's talk briefly about dependency management. As you may expect, the order in which you create Snowflake objects matters. For example, you need to create a database before you try creating a schema within that database. Terraform handles such dependencies implicitly through the use of references to other resources. For example, referencing the database name by the Terraform resource handler instead of a hard-coded database name informs the Terraform engine that the schema requires the database to be available first: 

```terraform
# ./modules/snowflake/main.tf
# ...
resource "snowflake_database" "hogwarts_db" {
  name                        = "HOGWARTS"
  data_retention_time_in_days = 0
}

resource "snowflake_schema" "raw" {
  database            = snowflake_database.hogwarts_db.name  # use resource handler instead of hard-coded "HOGWARTS"
  name                = "RAW"
  data_retention_days = 0
}
# ...
```

When Terraform sees such dependencies, the Terraform executable will ensure resources are created in the proper order. Conversely, if you use hard-coded string values to reference the database your schema resides in, you may have receive an error saying something like "schema cannot be created because database does not exist." Similar dependencies can be used to ensure that a user is created after the warehouse and role it will assume are created. 

If you scroll through the rest of `./modules/snowflake/main.tf`, you'll see resources for the service user and role as well as several privileges that allow the service role to use the database, schemas, tables, and virtual warehouse in our Snowflake account. 

Lastly, the module has an output file `./modules/snowflake/outputs.tf` that does what's perhaps obvious: it declares the module's output variables. 

```terraform
# ./modules/snowflake/outputs.tf
output "snowflake_warehouse_name" {
  value = snowflake_warehouse.hogwarts_wh.name
}

output "snowflake_service_user_username" {
  value = snowflake_user.svc_hogwarts.name
}
```

These output variables can then be used by other modules. For example, you may want to use the Snowflake warehouse name and service user name in another module that manages AWS resources, like AWS Glue for pipelines that deliver data to Snowflake via the service user. 

## Enough talk, I wanna see some action 
It's time to use Terraform to create Snowflake resources. Within the root Terraform directory, execute the following command to load the environment variables: 
`source .env`

Next we need to initialize the Terraform project. Run the command `terraform init` to download the required dependencies for managing Snowflake resources. 
Then execute the following command to create the Snowflake resources: 
`terraform apply`.
The CLI will present a summary of resources to be provisioned and give a prompt asking for confirmation before proceeding. Type "yes" and hit "enter"; this will cause the Terraform executable to provision the outlined resources. 

And boom! You have a database, three schemas, a service user, a virtual warehouse, and all the permissions needed created in _ seconds. 

Aside from writing the Terraform code, this approach of creating Snowflake resources is much faster than manually creating them through the UI. Destruction of cloud resources is just as fast and can be executed with a destroy command: 

```bash
terraform destroy
```

As with creation, terraform will prompt a list of all resources scheduled for destruction. You should read the list carefully before entering "yes". 

And that's it! This configuration will quickly allow the spinning up and tearing down of Snowflake databases. After resource creation, you can implement data pipelines to materialize tables and views within the three schemas. Destroying the resources via Terraform at the end of the day will ensure you do not pay for storage costs overnight. 

	











