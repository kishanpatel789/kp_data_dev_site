Title: Accio Database
Date: 2024-11-01
Slug: accio-database
Tags: api, python, data-engineering
Summary: Let's summon a database by scraping the Potter DB API!
Status: draft

Listen up, you witches and wizards. Today we're summoning a database. 

Here's the setup:

- We're sourcing data from the [Potter DB](https://potterdb.com/) API. 
- We'll use python to grab everything we can from the API and store the data as CSV files.
- Then we'll push the CSVs into a [SQLite database](https://www.sqlite.org/) using [SQLAlchemy](https://www.sqlalchemy.org/) (SQLWizardry?) models. 

By the end of this, you'll have a neat little database you can use for your programming (wizarding?) projects. 

Grab the [portkey](https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/accio_database) and let's get going!

## Part 1: Scraping the API (Accio Data)
Potter DB is a gem on the Internet. It's a project that scrapes the [Harry Potter wiki](https://harrypotter.fandom.com/wiki/) and makes its data available for programmatic use. The API has five endpoints: book, character, movie, potion, and spell. Our first script `scrape_api.py` will send requests to these endpoints and save the response in CSV files.

To avoid repeating ourselves for each of the endpoints, we'll use parameters as much as possible. The `schemas.py` file is the Maurader's Map of what endpoints we need to hit and what we need to look for when we get there. It's the file that essentially pumps the parameters with values. 

```python
# schemas.py
schemas = {
    #...
    "spell": {
        "api_endpoint": "v1/spells",
        "api_query": {"page[size]": 100},
        "attributes": [
            "slug",
            "name",
            "incantation",
            "category",
            "effect",
            "light",
            "hand",
            "creator",
            "image",
            "wiki",
        ],
    },
    #...
}
```

Like almost all REST APIs, Potter DB returns JSON objects, which can contain nested values. The Movie and Character objects have nested arrays to account for things like multiple producers or multiple love interests. Our database will feature relational tables, so we need to do a bit of transfiguration. 

To create relational tables, the nested arrays will be normalized into separate tables. For example, each character's array of romances will be written to a separate table called `character_romances`. When querying later, joins can be created between `character` and `character_romances` as needed. 

![Data transfiguration](/static/images/post007/DataTransfiguration.jpeg)

Lastly, there's no guard dog named Fluffy (i.e. authentication requirements) protecting the API. Instead the API limits usage by tracking your IP address. If we accidentally overuse the API and get 429 errors, the script uses exponential backoff to try again later. 

Alright, let's cast the first spell!

<img alt="Run scrape_api.py" src="/static/images/post007/TerminalScrapeAPI.jpeg" class="w-full md:w-auto md:max-w-2xl mx-auto">


## Part 2: Loading the Database (Wingardium Leviosa)
Now that we have our data in CSV format, we can load it into a database. Our second script `seed_db.py` uses SQLAlchemy to initialize a SQLite database. The script then reads the CSV files and inserts records into the database. 

The file `models.py` defines our tables as SQLAlchemy models, which describe our columns and foreign key relationships. Here's an example of the `Book` model: 

```python
# models.py
# ...
class Book(Base):
    __tablename__ = "book"

    id = mapped_column(String, primary_key=True)
    slug = mapped_column(String, unique=True, nullable=False)
    title = mapped_column(String, unique=True, nullable=False)
    summary = mapped_column(String)
    author = mapped_column(String)
    release_date = mapped_column(DateTime)
    dedication = mapped_column(String)
    pages = mapped_column(Integer)
    cover = mapped_column(String)
    wiki = mapped_column(String)

    chapters = relationship(
        "Chapter",
        lazy="joined",
        order_by="Chapter.order",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Book(id='{self.id}', slug='{self.slug}')>"
# ...
```

Before we load data into our tables, we need to prepare for some stricter data modeling rules, like data types and uniqueness. 

First, everything in a CSV file is a string. We need to make sure any datetimes in the CSV are interpreted as true datetime objects. The script performs this parsing and type conversion when creating the ORM object for each row. 

Second, we need to handle any duplicate records returned by the API. As the script walks through the CSV file, it logs a hash of the row's ID or the entire row itself. If a duplicate record is found, it is not written to the database; instead the record is sent to a text file `errors.txt` for later review. 

Step right up and cast the second spell! Watch the CSV file content levitate into the database. 

<img alt="Run seed_db.py" src="/static/images/post007/TerminalSeedDb.jpeg" class="w-full md:w-auto md:max-w-2xl mx-auto">

Log into the database at `./data/sqlite/potter.db` to make sure everything looks good. Give it a whirl and test out a query: 

```sql
SELECT *
FROM character
WHERE slug IN (
    'harry-potter',
    'hermione-granger',
    'ronald-weasley',
    'albus-dumbledore'
);
```

```text
id                                    slug              name                                     born                                                                      died                                                                                           gender  species  height  weight                                    hair_color                   eye_color     skin_color  blood_status  marital_status  nationality  animagus  boggart                           house       patronus              image                                                                                            wiki                                                
------------------------------------  ----------------  ---------------------------------------  ------------------------------------------------------------------------  ---------------------------------------------------------------------------------------------  ------  -------  ------  ----------------------------------------  ---------------------------  ------------  ----------  ------------  --------------  -----------  --------  --------------------------------  ----------  --------------------  -----------------------------------------------------------------------------------------------  ----------------------------------------------------
a57de83d-2a44-40d4-8060-75895fa756f5  albus-dumbledore  Albus Percival Wulfric Brian Dumbledore  Between 16 and 31 August 1881, Mould-on-the-Wold, England, Great Britain  30 June 1997 (aged 115), Astronomy Tower, Hogwarts Castle, Highlands, Scotland, Great Britain  Male    Human    5'11'   175 lbs (formerly; 1932), 168 lbs (1997)  Auburn (originally), Silver  Blue          Fair        Half-blood    Single          English                The corpse of his sister, Ariana  Gryffindor  Phoenix               https://static.wikia.nocookie.net/harrypotter/images/7/75/Albus_Dumbledore_%28HBPF_promo%29.jpg  https://harrypotter.fandom.com/wiki/Albus_Dumbledore
bcae9def-6584-4300-ac63-ff007974bf3c  harry-potter      Harry James Potter                       31 July 1980, Godric's Hollow, West Country, England, Great Britain                                                                                                      Male    Human                                                      Jet-black                    Bright green  Light       Half-blood    Married         English                Dementor                          Gryffindor  Stag                  https://static.wikia.nocookie.net/harrypotter/images/c/ce/Harry_Potter_DHF1.jpg                  https://harrypotter.fandom.com/wiki/Harry_Potter    
9a992090-02b8-4c89-9e6a-bdaa32404c69  hermione-granger  Hermione Jean Granger                    19 September 1979, England, Great Britain                                                                                                                                Female  Human    5'5'    118 lbs                                   Brown                        Brown         Pale        Muggle-born   Married         English                Failure                           Gryffindor  Otter                 https://static.wikia.nocookie.net/harrypotter/images/3/34/Hermione_Granger.jpg                   https://harrypotter.fandom.com/wiki/Hermione_Granger
d67ddb5d-192b-4d75-8f18-c55a1b5ce442  ronald-weasley    Ronald Bilius Weasley                    1 March 1980, Ottery St Catchpole, Devon, England, Great Britain                                                                                                         Male    Human    5'9'    152 lbs                                   Red                          Blue          Pale        Pure-blood    Married         English                Aragog                            Gryffindor  Jack Russell terrier  https://static.wikia.nocookie.net/harrypotter/images/4/44/Ronald_Weasley_DHF1.jpg                https://harrypotter.fandom.com/wiki/Ronald_Weasley
```

---

Mischief managed. You just used magic (programming) to capture data from an API and bottle it away in your private database. Yer a wizard, Harry. 

Want to go deeper as you study for your OWLs? Download the [code](https://github.com/kishanpatel789/kp_data_dev_blog_repos/tree/main/accio_database) and check out the README. 

On that note, [send me an owl](https://kpdata.dev) when you need help with your next magical challenge. 

