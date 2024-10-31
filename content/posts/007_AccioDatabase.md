Title: Accio Database
Date: 2024-11-01
Slug: accio-database
Tags: api, data-engineering
Summary: Let's summon a database by scraping the Potter DB API!
Status: draft

Listen up, you Muggles. Today we're summoning a database. 

Here's the set up:

- We're sourcing data from the [Potter DB](https://potterdb.com/) API. 
- We'll use python to grab everything we can from the API and store the data as CSV files.
- Then we'll push the CSVs into a [SQLite database](https://www.sqlite.org/) through the use of [SQLAlchemy](https://www.sqlalchemy.org/) (SQLWizardry?) models. 

By the end of this, you'll have a neat little database you can use for your programming (wizarding?) projects. 

Grab the portkey and let's get going!

## Part 1: Scraping the API (Accio Data)
The Potter DB is a gem on the Internet. It's a project that scrapes the [Harry Potter wiki](https://harrypotter.fandom.com/wiki/) and makes its data available for programmatic use. The API has 5 endpoints: book, character, movie, potion, spell, 

There's no guard dog named Fluffy (i.e. authentication requirements) protecting the API. Instead the API limits usage by tracking your IP address. We'll have to watch out for 429 errors when we overuse the API. We'll use exponential backoff for a few attempts before throwing an error to try again later. 

To avoid repeating ourselves for each of the 5 endpoints, we'll use parameters as much as possible. The schemas.py file is the map of what endpoints we need to hit and what we need to look for when we get there. It's the file that essentially pumps the parameters with values. 

Like almost all REST APIs, the Potter DB API returns JSON objects, which can contain nested values. Our database will feature relational tables, so there are two issues we need to handle delicately. 

1. relationships between chapters and books
2. nested arrays in movie and character entities

The chapter endpoint requires us to first know the book id the chapter is associated with. The code handles this by first scanning for all books and storing the data as a CSV file. Then the code reads the book id values from the CSV file and makes recurring calls to the chapter endpoint. 

Movie and character have nested arrays to account for things like multiple producers or multiple wands owned. To create relational tables, the nested arrays will be normalized into separate tables. For example, each movie's array of producers will be written to a separate table called `movie_producers`. Later, joins can be used between `movie` and `movie_producers` as needed. 

[INSERT DIAGRAM - json nested objects mapped to multiple relational tables]

## Part 2: Loading the Database (Wingardium Leviosa)
Now that we have our data in CSV format, we can load it into a database. We'll use Sqlite to persist our data. But in case we ever want to use another database system (postgres, mysql, etc), we'll use SQLAlchemy to handle all the nitty-gritty SQL logic for us. 

The file `models.py` defines the various tables and columns we need, as well as any foreign key relationships. Here's an example of the `Book` model: 

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

Run the script `seed_db.py` to iteratively read each CSV file and load its contents into the database. Along the way, we need to account for some stricter data modeling rules. 

First, we need to make sure datetimes stored as strings in the CSV file are parsed into true datetime objects when instantiating the ORM object. Second, we need to account for any duplicate records returned by the API. As the script walks through the CSV file, it keep a hash of the row's ID or the entire row itself. If a duplicate ID is found, it is not written to the database; instead the record is emitted to a text file `errors.txt` for later review. 

Log into the database to make sure everything looks good. Give it a whirl and test out a query. 

```sql
SELECT * FROM character WHERE UPPER(name) = 'HARRY JAMES POTTER';
```

```text
id                                    slug          name                born                                                                 died  gender  species  height  weight  hair_color  eye_color     skin_color  blood_status  marital_status  nationality  animagus  boggart   house       patronus  image                                                                            wiki                                            
------------------------------------  ------------  ------------------  -------------------------------------------------------------------  ----  ------  -------  ------  ------  ----------  ------------  ----------  ------------  --------------  -----------  --------  --------  ----------  --------  -------------------------------------------------------------------------------  ------------------------------------------------
bcae9def-6584-4300-ac63-ff007974bf3c  harry-potter  Harry James Potter  31 July 1980, Godric's Hollow, West Country, England, Great Britain        Male    Human                    Jet-black   Bright green  Light       Half-blood    Married         English                Dementor  Gryffindor  Stag      https://static.wikia.nocookie.net/harrypotter/images/c/ce/Harry_Potter_DHF1.jpg  https://harrypotter.fandom.com/wiki/Harry_Potter
```

## My turn!
Download the code from this repo folder: `` 
The README gives specific setup instructions. 

---

Mischief managed. You just used magic (programming) to capture data from an API and bottle it away in your private database. You're a wizard, Harry. 

[Send me an owl](https://kpdata.dev) when you need help with your next challenge. 

