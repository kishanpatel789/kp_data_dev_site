Title: Snowflake with Terraform
Date: 2024-04-24
Slug: snowflake-with-terraform
Tags: cloud, terraform, snowflake
Summary: Cut down on your Snowflake project costs by managing cloud infrastructure with Terraform!
Status: draft

It's a lot of fun to develop a new project using a cloud platform like [Snowflake](https://www.snowflake.com/). You can quickly spin up databases and virtual compute with the click of a button to test new features. What's not fun is the unexpected bill that comes at the end of the month. When developing proof-of-concepts, these costs can be drastically reduced by simply destroying the resources created in Snowflake when you're not using them. Ideally, you could spend your day working in the cloud platform and at the end of the day, you could quickly tear down what you built to avoid storage and compute costs overnight. Even more ideally, you could re-provision your cloud resources the next day to continue your work. 

[Terraform](https://www.terraform.io/) is an Infrasturcture-As-Code (IAC) solution for managing cloud resources. That's a fancy way of saying that you use programming to create stuff in the cloud instead of using the traditional click-and-type steps in a user interface or instead of using a custom API made available by the cloud provider. Terraform allows you to define the target state of your cloud resources and keeps a log of the current state. The Terraform executable then attempts to create, modify, and delete cloud resources to make the current state match the target state.  

On a recent data engineering project, I used Snowflake as a data warehouse. The setup included a database, three schemas and a service user that would be used to manage data objects within the database. Below is a brief description of how you can use Terraform to provision a basic data warehouse. 

## Setup

For small projects, you can keep store the current state on your local machine. For production environments, it's best to use Terraform Cloud to manage the current state, especially when collaborating with other developers.

Download Terraform executable: https://developer.hashicorp.com/terraform/install

Create snowflake account: https://signup.snowflake.com/

Download repo: https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/snowflake_with_terraform

modify variables

Before the terraform configuration can take affect, a target Snowflake account and configuration need to be established. A Snowflake account can be created here: [insert url]
The user used to create the account should have the ACCOUNTADMIN role. 
On the local computer, create a configuration file `~/.snowflake/config` that contains Snowflake credentials for the user with the ACCOUNTADMIN role:

```toml
[default]
account='<snowflake-account-identifier>'
user='<user-name>'
password='<user-password>'
role='ACCOUNTADMIN'
```

## Explanation of repo

Here's the directory of files we need:

```bash
├── main.tf
├── modules
│   └── snowflake
│       ├── main.tf
│       ├── outputs.tf
│       └── variables.tf
├── outputs.tf
└── variables.tf
```


The root directory's `main.tf` file can be considered the entry point for the terraform configuration. It lists the required providers and modules that will be maintained by the repo. In this case, we define the snowflake provider sourced from `Snowflake-Labs/snowflake` and specify a local backend. The local backend simply states that the "status" of the current cloud resources is stored on your local machine. In production, you'd want this to be in a shared location like Terraform Cloud for team collaboration and increased reliability. 
We have one module "snowflake" which requires a single variable for the service user's password. The variable is passed to the Terraform executable at runtime as an environment to avoid committing the password to the code's repository. The password can be stored in the file .env and declared in the variables.tf file.

Within the snowflake module, we define two variables for the service user password as well as the snowflake configuration profile name set in the local machine. 
The module's main.tf file configures the provider to use this profile and then defines the cloud resources to provisioThe root directory's `main.tf` file can be considered the entry point for the terraform configuration. It lists the required providers and modules that will be maintained by the repo. In this case, we define the snowflake provider sourced from `Snowflake-Labs/snowflake` and specify a local backend. The local backend simply states that the "status" of the current cloud resources is stored on your local machine. In production, you'd want this to be in a shared location like Terraform Cloud for team collaboration and increased reliability. 
We have one module "snowflake" which requires a single variable for the service user's password. The variable is passed to the Terraform executable at runtime as an environment to avoid committing the password to the code's repository. The password can be stored in the file .env and declared in the variables.tf file.

Within the snowflake module, we define two variables for the service user password as well as the snowflake configuration profile name set in the local machine. 
The module's main.tf file configures the provider to use this profile and then defines the cloud resources to provision. 
One might expect that the order of resource creation matters. For example, a database must be created before an attempt is made to create a schema within that database. Terraform handles such dependencies implicitly through the use of referenes to other resources. For example, referencing the database name by the terraform resource handler instead of a hard-coded database name informs the Terraform engine that the schema requires the database to be available first. 
Similar dependencies can be used to ensure that a user is created after the warehouse and role it will assume is created. 
This dependency management is perhaps most important when assigning permissions to roles in Snowflake. To ensure the role has rights on both current tables and future tables, a pair of "grant privileges" resources can be created for each schema. 



## Let's get this show on the road

Within the root Terraform directory, execute the following command to load the environment variables: 
`source .env`

The first step in executing the terraform project is initialization. Run the command `terraform init` to download the required dependencies for managing Snowflake resources. 
Then execute the following command to create the Snowflake resources: 
`terraform apply`.
The CLI will present a summary of resources to be provisioned and give a prompt asking for confirmation before proceeding. Entering "yes" will cause the Terraform executable to provision the outlined resources. 

This approach is much faster than manually creating resources through the UI. Destruction of cloud resources is just as fast and can be executed with a destroy command: 

```bash
terraform destroy
```

As with creation, terraform will prompt a list of all resources scheduled for destruction. You should read the list carefully before entering "yes". 

And that's it! This configuration will quickly allow the spinning up and tearing donw of Snowflake databases. After resource creation, you can implement data pipelines to materialize tables and views within the three schemas. Destroying the resources via Terraform at the end of the day will ensure you do not pay for storage costs overnight. 

	











