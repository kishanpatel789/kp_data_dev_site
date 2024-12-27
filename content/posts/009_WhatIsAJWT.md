Title: What is a JWT?
Date: 2025-01-01
Slug: what-is-a-jwt
Tags: system-design, python
Summary: You use it every day but hardly think about. Let's talk about the Javascript Web Tokens you've been throwing around the Internet.
Status: draft

It's 11:00PM. You have the munchies, so you start an order from your favorite midnight cookie delivery service. You go to the website, enter your username and password, and are logged in. 

As you load your shopping cart with a dozen snickerdoodle cookies and the regret of failing your new year resolution, you begin to wonder... How does this website know who I am when I hit the "Place Order" button?

As you enter your credit card info, you remember that HTTP (the way you interact with websites) is stateless. That's a fancy way of saying the website doesn't keep an ongoing connection with your web browser. Everytime you interact with the site, you need to tell the site who you are... but you somehow don't give your username and password every time you click another button on the site. 

This is where Javascript Web Tokens, or JWTs, come into play. JWTs are little bits of string that are sent to your browser after you log in with your username and password. As you interact with the site, your browser sends that JWT with each HTTP request. The server reads the JWT to understand who is sending the request. 

<img alt="HTTP Flow" src="/static/images/post009/HTTPFlow.jpeg" class="w-full my-4 md:w-auto md:max-w-2xl mx-auto">

What does a JWT look like? Here's an example:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYXJyeSBwb3R0ZXIiLCJpYXQiOjE3MzUzMjE3OTIsImV4cCI6MTczNTMyODk5MiwibmJmIjoxNzM1MzIxNzg3LCJhdWQiOiJhY2Npby1jb29raWVzLXdlYnNpdGUifQ.SprmLvf2SgcDnH1CFVMIU20WOyNUzp-lCyCCYYjT8lM
```

Hey, don't get mad; you asked for an example. 

A JWT is a bunch of characters that don't look like much. But hidden in this garble is some important info about who you are. Let's break it down. 

Every JWT has three parts, separated by two periods. 

1. Header
2. Payload
3. Signature

Let's look at the middle part, the payload, for now. Each of the components is base-64 encoded. To figure out what the payload is, we can simply decode it:

```python
import json, base64

def base64_urldecode(input_str: str) -> dict:
    """Convert base-64 encoded string into utf-8 string and output as dictionary. 
    Assumes input represents a JSON object.

    Args:
        input (str): Base-64 encoded string

    Returns:
        dict: Dictionary representing input string
    """
    input_bytes = input_str.encode('utf-8')

    # apply base-64 padding
    rem = len(input_bytes) % 4
    if rem > 0:
        input_bytes += b"=" * (4 - rem)

    # decode base-64 string and convert to dictionary
    output_str = base64.urlsafe_b64decode(input_bytes).decode('utf-8')
    output_dict = json.loads(output_str)

    return output_dict

# decode payload
base64_urldecode('eyJzdWIiOiJoYXJyeSBwb3R0ZXIiLCJpYXQiOjE3MzUzMjE1NTUsImV4cCI6MTczNTMyODc1NSwibmJmIjoxNzM1MzIxNTUwLCJhdWQiOiJhY2Npby1jb29raWVzLXdlYnNpdGUifQ')
```
```text
{'sub': 'harry potter',
 'iat': 1735321555,
 'exp': 1735328755,
 'nbf': 1735321550,
 'aud': 'accio-cookies-website'}
```

Well well well... if it isn't Mr. Potter. 

```python
# convert unix timestamp to datetime
def print_timestamp_as_datetime(timestamp: int):
    print(
        datetime.fromtimestamp(timestamp, timezone.utc).strftime("%Y-%m-%d %H:%M:%S %Z")
    )

print_timestamp_as_datetime(1735321555)  # iat: 2024-12-27 17:45:55 UTC
print_timestamp_as_datetime(1735328755)  # exp: 2024-12-27 19:45:55 UTC
print_timestamp_as_datetime(1735321550)  # nbf: 2024-12-27 17:45:50 UTC
```