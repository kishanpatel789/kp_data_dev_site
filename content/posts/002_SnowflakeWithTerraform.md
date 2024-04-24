Title: Snowflake with Terraform
Date: 2024-04-24
Slug: snowflake-with-terraform
Tags: cloud, terraform, snowflake

When developing a new project on a cloud platform, it's nice to be able to quickly tear down what you built at the end of the day so you don't incur storage and compute costs overnight. Even more helpful is being able to re-provision your cloud resources the next day to continue your work. 

On a recent data engineering project, I used Snowflake as a data warehouse. The setup included a three schemas and a service user that would be used to manage data objects within the databases. What follows is a brief description of how you can use Terraform to provision a basic data warehouse. 

database
three schemas
service user
privileges

Here's the directory of files we need:

- main.tf
- outputs.tf
- variables.tf
- modules
	- snowflake
		- main.tf
		- outputs.tf
		- variables.tf

The code can be found in this repo: [link here]

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


















