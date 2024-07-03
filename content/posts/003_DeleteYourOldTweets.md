Title: Delete Your Old Tweets
Date: 2024-07-04
Slug: delete-your-old-tweets
Tags: automation
Summary: Wash away your digital regret by sending a bot to delete those embarrassing Tweets. 
Status: draft

It was 2009. Twitter was the new kid on the block. I was in college, and all my friends were using the platform to share their statuses in 140 characters or less. Peer pressure pulled in me in; I became a Tweeter. It started out simple -- I shared what I was doing on the weekend. Then I got the hang of using puns to get a quick Retweet. Before long, I was a Twitter regular, launching status updates every day. 

Fifteen years later, I had a trail of digital breadcrumbs showcasing my ignorance and foolishness... like this one: 

[insert tweet]

And then there's this beauty: 

[insert tweet 2]

Ugh... The regret and embarrassment weighed heavier as I scrolled through my past. 

"Did I really say that?" 

"I can't believe I took up Internet real estate with this junk." 

Now it's 2024. I have a Twitter account littered with stupid status updates. I haven't used my Twitter account in a few years, so the easiest way to erase history is to delete the account. But I want to retain my account for future use and remove the Tweets marking my infancy. I have about 1,000 Tweets, and there's no way I'm going to manually delete them one-by-one. 

I needed a bot, a personal assistant, to do the grunt work for me. Thus started a journey to explore the Twitter API and develop a programmatic way of deleting Tweets. Below you'll see my Twitter magic eraser, a couple of quick python scripts. The scripts make use of the [tweepy](https://www.tweepy.org/) package to interact with the Twitter API. You can repurpose the code to wash away your own Tweets of the past.

## Set Up
### 1. Get Tweet Data
You first need to identify the Tweets you want to delete. Head over to your [Twitter account page](https://twitter.com/settings/account) and request an archive of your Tweets. It may take a day or two, but eventually, there'll be a zip file available for you to download. The zip file contains an HTML file with supporting CSS and Javascript files to view your tweets from a local web server. Buried in the files is a single file containing the Tweet data itself: `tweets.js`

[insert image of archive file structure] 

This file contains info about all of your Tweets like the Tweet date, the number of times the Tweet was favorited, and of course, the text of the Tweet itself. But the most important component is the Tweet ID. This is how we target the Tweets we want to delete. 

### 2. Become a Twitter Developer
Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) and use your existing Twitter account to log in. You'll likely be asked to pick an access level. For this small project, the "Free" access level should suffice. 

The Twitter developer platform is organized into projects that contain applications, or apps. Create a single project and call it something useful like `clean_up_twitter`. Within the project, create an app with "read and write" permissions and defined as "web app, automated bot". 

Now comes the hairy part: generating the credentials that will eventually be used by your script to delete Tweets. In the app settings, you need to generate the following: 

- API Key
- API Key Secret
- Access Token
- Access Token Secret

That's a lot of secrets; let's break it down. The API key and API key secret are credentials that will be used by the script. They say, "Hey Twitter, I'm the bot representing the project and app you already know about." The access token and access token secret, on the other hand, represent credentials for your specific Twitter account; they allow the script to delete Tweets on your behalf. Specifically, the access token and token secret are user-specific credentials used to authenticate via the OAuth1.0a protocol. 

Save these four secrets somewhere safe. Our code will need them to make changes to your Tweets.

### 3. Get the Code
Download the magic eraser from this Github repo, featuring two scripts: 

1. extract_tweet_ids.py - extracts Tweet IDs from nested JSON object in archive
2. delete_tweets.py - deletes 50 Tweets at a time and updates a tracking file

The first script can be executed from the command line. It takes an optional argument defining the path to the tweets.js file. If the argument is not provided, it assumes the file is located in the standard archive location within the same directory. The file reads `tweets.js` and removes extraneous javascript variable definitions, leaving a true JSON object. Afterward, each object within the JSON is parsed and tweet IDs are extracted. The Tweet IDs are then written to a CSV file structured with two columns: the ID and the deletion status of "pending". This file is used as a tracker to check which Tweets have been deleted and which are still active. 

The second script uses the CSV file and does the hard work of deleting your Tweets. The core logic is within the `delete_tweets()` function (see below). For every Tweet with a status of "pending", the `tweepy` client deletes the Tweet by referencing its ID. For the sake of record keeping, the Tweet ID is then associated with a status of "deleted". After deleting 50 Tweets, the script updates the tracker file. 

```python
# delete_tweets.py
# ...
def delete_tweets(client: tweepy.Client, tweet_list: List[str]) -> None:
  """
  Delete up to 50 tweets based on pending status.

  Args:
    client (tweepy.Client): the authenticated Tweepy Client object.
    tweet_list (List[str]): a list of tweet IDs to be deleted.
  """    
  deleted_count = 0
  for tweet in tweet_list:
    tweet_id, status = tweet
    if status == 'pending' and deleted_count < 50:
      try:
        client.delete_tweet(tweet_id)
        logger.info(f"Deleted tweet {tweet_id}")
        tweet[1] = 'deleted'
        deleted_count += 1
      except tweepy.TooManyRequests:
        logger.error(f"Failed to delete tweet {tweet_id} due to too many requests")
        return tweet_list
      except tweepy.TweepyException as e:
        logger.error(f"Failed to delete tweet {tweet_id}: {e}")
      time.sleep(1)  # sleep to avoid hitting API rate limits

  return tweet_list
# ...
```

You may be wondering, "Why delete only 50 Tweets?" Well, here's the rub. A free project using the Twitter API only allows 50 delete requests per day. If you have the cash, you can fork over $5,000 per month for a blazing 50 delete requests per 15 minutes (4,800 requests per day). But for most of us, that's overkill, and the cost can't be justified. 

## Do the Deed
Let's delete some Tweets. First create a python virtual environment and install the packages we'll need. The `requirements.txt` file contains the two primary packages `tweepy` and `python-dotenv` as well as their dependencies. 

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Next, we'll run the first script to get our Tweet IDs. It helps to have the unzipped Twitter archive in the same directory as your scripts. However, this isn't required. Wherever that golden `tweets.js` file is, run the first script from the command line and use the `--file_name` option to target the file:

```bash
python extract_tweet_ids.py --file_name=<path/to/tweets.js>
```

Like I said earlier, this will generate a CSV file `tweet_ids.csv` listing the Tweet IDs and a starter status of "pending". I recommend you manually rename this file to something like `tweet_tracker.csv` that can serve as your up-to-date log of which Tweets you've actually deleted. This manual renaming prevents accidentally deleting your progress if you re-run the first script a second time, which would overwrite `tweets_ids.csv`. 

Before we move to the second script, create an `.env` file in the same code directory. Enter the four secrets you saved earlier for your developer app. Also include the path to your tracker file. These variables will be used in the second script. 

```bash
# .env
API_KEY=<your-api-key>
API_KEY_SECRET=<your-api-key-secret>
ACCESS_TOKEN=<your-access-token>
ACCESS_TOKEN_SECRET=<your-access-token-secret>
TRACKER_FILE_PATH=./tweet_tracker.csv
```

Alright, here we go. We're ready to pull the trigger. Run the following command from the terminal and watch what happens. 

```bash
python delete_tweets.py
```

If things go smoothly, you'll see 50 of your Tweets disappear. Throughout the process, logs are sent to the console and a log file to keep you informed of what's going on. 

Again the free access to the Twitter API limits you to 50 delete requests per 24 hours. I re-ran this script everyday until I was left with zero Tweets. Spending a minute a day for a couple of weeks got me to a clean Twitter slate, free of my youthful blabbering. 

Maybe you're like me. Perhaps you began using social media in your younger years. We grow up, and our thoughts and philosophies change. Revisiting our content of yesteryear makes us wonder, "What was I thinking?" It's okay. We can have a fresh start. 

---

I recognize Twitter is now X. I don't care. It's still Twitter to me. 
