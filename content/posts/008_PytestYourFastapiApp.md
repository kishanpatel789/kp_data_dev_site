Title: Pytest Your FastAPI App
Date: 2024-12-02
Slug: pytest-your-fastapi-app
Tags: api, python
Summary: Protect your future app by creating software tests today. Here's how you integrate pytest into your FastAPI app.
Status: draft

I love my wife. I want to help her any way I can. 

So when she says she's frustrated with recipe websites bloated with ads and blogs, my caveman "provide-for-the-family" instincts kick in. I fire up my computer to make my own recipe app. 

To be clear, I'm not a professional app developer. But I've watched a lot of Disney movies about how love can change the world. Surely my affection for my wife is enough to birth a simple webapp. I figure it'll take a couple of weeks to build the backend database and API. And then I'll somehow put a nice UI on top of it. Then I'll package up the app and deliver it to my wife just in time for Christmas.

A week later, my API is putting out our favorite recipes. The app is far from complete, but I'm feeling pretty good about myself. 

I add a new feature that allows the user to update a recipe. But when I try to retrieve recipes from the API again, the app crashes. 

My smile fades. What happened? It was working... I added a new feature... and now it's not working. 

I search my code, looking for how I sabotaged my hard-earned progress. Minutes turn to hours as my self-imposed Christmas deadline looms. I finally figure out it out. I changed my API schema to allow recipe *updates*, but that broke the expected output of the endpoint that *reads* recipes. The new schema for updating recipes was incompatible with how the app read recipes. 

It dawns on me that this app is more complex than a linear data pipeline or a small python script. There are many moving parts that interact with each other. I need to guarantee the stuff I've already built doesn't break when I build new parts. I need software tests.

---

Writing software tests is like exercising or flossing. Everyone knows you should do it... but few of us actually do it. However, like lifting weights and brushing your pearly whites, using software tests can spare you headaches in the future. 

A test is an automated way to check if your app is working as expected. You write what your app should do in a given scenario, and some test manager then runs that test on your behalf. String enough of these tests together, and you'll have a safety net. Then you can add new features confidently while making sure existing features still work. You simply add the new feature and then re-run your tests. If the tests pass, congratulations! You probably didn't break anything (assuming you have good test coverage). 

Here, we'll go through how you can write tests for a [FastAPI](https://fastapi.tiangolo.com/) app with python's [pytest](https://pytest.org/) module. But first, what does a test even look like? Check this one out: 

```python
# test_recipes.py
# ...
def test_read_recipe_by_id_not_found(test_client):
    response = test_client.get("/recipes/id/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Recipe '999' not found"
# ...
```

That's it. A test is just a function that does something and checks for assertions. In this example, a GET call is made to the API's recipe endpoint using a bogus ID of 999. The test then checks the expected 404 error is returned with a helpful message. 

How do run these tests, you ask? Just run the command `pytest -v` in your command line. (We'll talk specifics later.)

<img alt="Run tests" src="/static/images/post008/RunTests.jpeg" class="w-full md:w-auto md:max-w-2xl mx-auto">

Boom. 21 tests just ran in 1.61 seconds. I hope you're as excited about tests as I am! Let's dig deeper. 

## Get the Code
Grab the [code from this repo folder](https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/pytest_your_fastapi_app). Follow the README if you want to run this yourself. Here's what we have this time:


```bash
├── api
│   ├── config.json
│   ├── config.py
│   ├── database.py
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── routers
│   │   ├── common.py
│   │   ├── __init__.py
│   │   ├── recipes.py
│   │   └── units.py
│   ├── schemas.py
│   └── tests
│       ├── conftest.py
│       ├── __init__.py
│       ├── seed_test_db.py
│       ├── test_main.py  
│       ├── test_recipes.py   # <--- this tests the "recipe" endpoints
│       └── test_units.py     # <--- this tests the "unit" endpoints
├── scripts
│   └── ...
└── seed_data
    └── ...
```

On a high level, the FastAPI application is a CRUD app for recipes. The backend database is in [SQLite](https://www.sqlite.org/) and communication with the database is handled with [SQLAlchemy](https://www.sqlalchemy.org/). The FastAPI app is basically an interface to read, edit, or create recipes. 

Today, we're focusing on one directory: `./api/tests/`. This folder contains all the material for our tests. 

Pytest is one of the most popular testing frameworks in the python ecosystem. Writing your tests is a breeze and the error messages you get out-of-the-box are very useful for catching bugs early. 

## How do I use this thing?

Here we'll set up a test suite for a fastapi application that interacts with a backend database. 

A key of testing is setting up the environment when the tests run. Pytest fixtures can be used to ensure that certain criteria are implemented before testing begins and then torn down when the test ends. In our scenario, we're using a fixture to spin up a test database for testing. After all, we don't want test data to enter into our production database. 

we'll use another fixture to re-use a sample recipe. 

directory desc

what does a test look like

fixtures for test db

---

Be a better husband than me. Write software tests to make your wife happy. 

## swirl
I built a recipe app. Then I rebuilt it. Then I tweaked a feature. All of a sudden the other feature I built earlier didn't work as expected. Here's the scary part: I didn't even know it until a few days later...

As my app grew, introducing new features without breaking existing ones became a delicate. Make sure the existing app still worked became tedious. It was well-past time to implement my safety net: testing. 

Software testing is like eating well and exercising. Everyone knows you should do it, but people seldom do it. 
Software testing is a best practice, often recommended yet seldom used. It's more fun to keep building new stuff. Making sure that every nook and cranny works is boring. 

Yet here I was... a app that used to work well now failed to meet its basic utility. 


Endpoints: recipe, units



Fixtures
Parametrization
Marker
Plugin
Config



