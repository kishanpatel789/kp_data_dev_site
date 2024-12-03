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

I search my code, looking for how I sabotaged my hard-earned progress. Minutes turn to hours as my self-imposed Christmas deadline looms. I finally figure it out. I changed my API schema to allow recipe *updates*, but that broke the expected output of the endpoint that *reads* recipes. The new schema for updating recipes is incompatible with how the app reads recipes. 

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

How do you run these tests, you ask? Just enter the command `pytest -v` in your command line. (We'll talk specifics later.)

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

On a high level, the FastAPI application is a CRUD app for recipes. The backend database is in [SQLite](https://www.sqlite.org/) and communication with the database is handled with [SQLAlchemy](https://www.sqlalchemy.org/) models. The FastAPI app is an interface to read, edit, or create recipes. 

Today, we're focusing on one directory: `./api/tests/`. This folder contains all the material for our tests. 

The three files with the prefix `test_` are where the 21 tests are defined. The file `conftest.py` contains objects shared among the test files (fixtures, plugins, etc.). And the file `seed_test_db.py` does what you might expect; it creates and seeds a test database. 

## How Do I Use This Thing?

First thing's first: We don't want to muck up our production database when testing our app. You may have a test that creates a recipe called "My Test Recipe", but you don't want that to appear next to your "Grandma's Chocolate Chip Cookies" recipe in the actual app. 

Instead, every time we run a test, we want a separate database specifically for testing. [Pytest fixtures](https://docs.pytest.org/en/6.2.x/fixture.html) ensure that certain criteria are implemented before testing begins and then torn down when the test ends. In our scenario, we're using a fixture `test_db` to do the following:

1. Spin up a test database and load seed data
1. Override the FastAPI database dependency (so the app points to the test database instead of the prod database)
1. Wait until tests are complete... (yield)
1. And then tear down the test database tables

```python
# conftest.py
# ...
@pytest.fixture(scope="session")
def test_db():
    """Fixture to initialize a test database and override the fastapi application's db dependency"""
    # initialize database
    metadata_obj.create_all(bind=TestEngine)

    # seed database
    seed_test_db(TestSessionLocal)

    # override app dependency
    def _override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db

    yield

    # clear app dependency and tear down db
    app.dependency_overrides.clear()
    metadata_obj.drop_all(bind=TestEngine)


@pytest.fixture(scope="module")
def test_client(test_db):
    """Fixture to generate test client"""
    yield TestClient(app)
```

After that, the `test_db` fixture is passed to a second fixture: `test_client`. It's this `test_client` fixture that is used by every single test to ensure the database configuration is consistent between tests. The fixture simply makes a client object available to the test to make HTTP requests to the FastAPI app.

Fixtures are also helpful for reference a certain data point among tests. For example, the `test_recipes.py` module defines a sample recipe as a fixture. That sample recipe is then used in multiple tests so it doesn't have to be re-defined each time. 

```python
# test_recipes.py
# ...
@pytest.fixture
def sample_recipe():
    """Sample recipe for testing."""
    return {
        "id": 1,
        "name": "Channa Masala",
        "slug": "channa-masala",
        "is_active": True,
    }

@pytest.fixture
def expected_response_keys_recipes():
    """Fixture to provide expected keys and their types."""
    return {
        "name": str,
        "slug": str,
        "id": int,
        "date_created": str,
        "date_modified": type(None),
        "created_by": int,
        "modified_by": type(None),
        "is_active": bool,
    }
# ...
def test_read_recipe_by_id(
    test_client, sample_recipe, expected_response_keys_recipe_detail
):
    response = test_client.get(f"/recipes/id/{sample_recipe['id']}")
    response_json = response.json()

    assert response.status_code == 200
    assert response_json["id"] == sample_recipe["id"]
    assert response_json["name"] == sample_recipe["name"]
    assert response_json["slug"] == sample_recipe["slug"]
    assert response_json["is_active"] == sample_recipe["is_active"]
    for key, value_type in expected_response_keys_recipe_detail.items():
        assert key in response_json, f"Key '{key}' is missing in the response"
        assert isinstance(
            response_json[key], value_type
        ), f"Key '{key}' is not of type {value_type}"
# ...
```

The fixtures rabbit hole goes deep. Visit the [docs](https://docs.pytest.org/en/6.2.x/fixture.html) to learn more. 

Alright, getting back to how we run the test. The pytest framework operates from the command line. When in the project directory, execute `pytest`. Pytest will then collect the tests defined in the directory and execute them. The PASS/FAIL of each test will be presented. 

Just to simulate a failure, here's a test run where a test is intentionally designed to fail. Note how the output clearly indicates what went wrong. The test expected a recipe name of "Channa Masala" but got "gobbledegook": 

<img alt="Test failure" src="/static/images/post008/TestFailure.jpeg" class="w-full md:w-auto md:max-w-2xl mx-auto">

---

Pytest is one of the most popular testing frameworks in the python ecosystem. Writing your tests is a breeze and the error messages you get out-of-the-box are very useful for catching bugs early. 

Be a better husband than me. Write software tests from the beginning of your project. Your wife will thank you, and [you'll thank me](https://kpdata.dev). 




