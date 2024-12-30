Title: What is a JWT?
Date: 2025-01-01
Slug: what-is-a-jwt
Tags: system-design, python
Summary: You use it everyday but hardly think about. Let's talk about the Javascript Web Tokens you've been throwing around the Internet.
Status: published
MetaImage: /static/images/post009/JWTCoin.jpeg

It's 11:00 PM. You have the munchies, so you start an order from your favorite midnight cookie delivery service. You go to the website, enter your username and password, and are logged in. 

As you load your shopping cart with a dozen snickerdoodle cookies and the regret of failing your new year resolution, you begin to wonder... How does this website still know who I am when I hit the "Place Order" button?

As you enter your credit card info, you remember that HTTP (the way you interact with websites) is stateless. That's a fancy way of saying the website doesn't keep an ongoing connection with your web browser. Every time you interact with the site and click on different buttons, your browser opens a new connection to the website, so you need to tell the web server who you are again... but you somehow don't need to give your username and password more than once. 

This is where Javascript Web Tokens, or JWTs, come into play. JWTs are little bits of text that are sent to your browser after you log in with your username and password. As you interact with the site, your browser sends that JWT back to the server with each HTTP request. The server reads the JWT to understand who is sending the request. 

<img alt="HTTP Flow" src="/static/images/post009/HTTPFlow.jpeg" class="w-full my-4 md:w-auto md:max-w-2xl mx-auto">

## What exacty is in a JWT?

What does a Javascript Web Token look like? Here's an example:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYXJyeSBwb3R0ZXIiLCJpYXQiOjE3MzUzMjE3OTIsImV4cCI6MTczNTMyODk5MiwibmJmIjoxNzM1MzIxNzg3LCJhdWQiOiJhY2Npby1jb29raWVzLXdlYnNpdGUifQ.SprmLvf2SgcDnH1CFVMIU20WOyNUzp-lCyCCYYjT8lM
```

Hey, don't get mad; you asked for an example. 

A JWT is a bunch of characters that don't look like much. But hidden in this garble is some important info about who you are. Let's dissect this token. 

Every JWT has three parts, separated by dots (`.`). 

1. Header (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
2. Payload (`eyJzdWIiOiJoYXJyeSBwb3R0ZXIiLCJpYXQiOj`...)
3. Signature (`SprmLvf2SgcDnH1CFVMIU20WOyNUzp-lCyCCYYjT8lM`)

Let's focus on the middle part. The payload is [base-64 encoded](https://en.wikipedia.org/wiki/Base64). To make the payload easier to read, we simply decode it:

```python
def base64_urldecode(input_str: str):
    """Convert base-64 encoded string into utf-8 string and print output.
    Assumes input is a JSON object.

    Args:
        input_str (str): Base-64 encoded string
    """
    input_bytes = input_str.encode("utf-8")

    # apply base-64 padding
    rem = len(input_bytes) % 4
    if rem > 0:
        input_bytes += b"=" * (4 - rem)

    # decode base-64 string and convert to dictionary
    output_str = base64.urlsafe_b64decode(input_bytes).decode("utf-8")
    output_dict = json.loads(output_str)

    print(json.dumps(output_dict, indent=4))


# decode our example payload
base64_urldecode(
    "eyJzdWIiOiJoYXJyeSBwb3R0ZXIiLCJpYXQiOjE3MzUzMjE1NTUsImV4cCI6MTczNTMyODc1NSwibmJmIjoxNzM1MzIxNTUwLCJhdWQiOiJhY2Npby1jb29raWVzLXdlYnNpdGUifQ"
)
```

```json
// decoded payload
{
    "sub": "harry potter",
    "iat": 1735321555,
    "exp": 1735328755,
    "nbf": 1735321550,
    "aud": "accio-cookies-website"
}
```

Well well well... if it isn't Mr. Potter. 

It looks like this payload is just a JSON object of 5 key-value pairs, or claims. The payload says who the user is and gives some info about when the token is valid. The [Javascript Web Token industry standard](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1) defines some claims that can be in a JWT:

- `sub` (subject): The subject or user represented by the token; this is usually a username
- `iat` (issued at): The time at which the JWT was created
- `exp` (expiration time): The time *after* which the JWT must not be accepted
- `nbf` (not before): The time *before* which the JWT must not be accepted
- `aud` (audience): The recipient the claim is intended for

For our example, the subject (or user) is `harry potter`. The `iat`, `exp`, and `nbf` claims are given in [Unix time](https://en.wikipedia.org/wiki/Unix_time), which can be converted into human-friendly datetimes using the snippet below. 

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

Last, the `aud` claim indicates that this token is to be used by the `accio-cookies-website` app only. Together, this token says that `harry potter` can access `accio-cookies-website` between `2024-12-27 17:45:50 UTC` and `2024-12-27 19:45:55 UTC`. 

## But how does this stop shady business?

If I'm feeling sneaky, I could create my own JWT using Mr. Potter's name and send it with my HTTP requests to the website. Then I could order cookies using his account (but have them delivered to my door). The question is, how does the web server know the JWT it receives is legit, that it hasn't been forged or tampered with? 

When the server creates the token, it uses a secret that only it knows to sign the token. In the future, when the server receives a JWT from a user, it checks the token's signature to see if the token was truly created by the server. 

This is where the header and signature parts of the JWT come in. The header declares the type of token (e.g. `JWT`) and a hashing algorithm (e.g. `HS256`) that will be used to later create a signature. 

```json
// decoded header
{
    "alg": "HS256",
    "typ": "JWT"
}
```

Here's how token creation works: 

1. The server creates a header, like the one in our example above.
1. The server base-64 encodes the header and payload. The server then  combines them with a dot (`.`). 
2. Using some secret key, the server hashes the combined header and payload using the algorithm declared in the header (`HS256`). This forms the signature and 3rd part of the JWT. 

Later, when the server receives a token, it validates the token using these steps: 

1. Combine the token's header and payload with a dot (`.`). 
2. Hash the combined string using the algorithm in the header and the secret key stored on the server. 
3. Check if the hashed value matches the signature in the token.

If I created my own JWT using Mr. Potter's name in the `sub` claim, then the hashed value computed on the server won't match the signature in my fake token. This is because the hashing process requires the secret key that is stored on the server and not available to me. 

Here is the beauty of JWT. It's a way for the server to store info about the user on a web browser. And if someone tampers with the token or forges a new token, the server will know about it. 

Dig around the [jwt.io](https://jwt.io/) website to get a deeper understanding. The website has an interactive tool to create your own JWTs. 

<img alt="jwt.io website" src="/static/images/post009/JWTWebsite.jpeg" class="w-full my-4 md:w-auto md:max-w-2xl mx-auto">


## Implementing JWT in python apps

Want to use JWT in your python apps? Then you need to accept the responsbility of creating tokens for users and validating them. Luckily, there's a handy package that does the heavy lifting: [PyJWT](https://pypi.org/project/PyJWT/)

PyJWT's `encode()` function takes a payload, secret key, and hashing algorithm. It then creates the token and returns it as a string. Here's the code used to create our example token: 

```python
# define payload parameters
ACCESS_TOKEN_AUD = "accio-cookies-website"
SECRET_KEY = "c06bcea721636bc2ef625e1bf9308b67b3820f8329403399aaccb6644c0aea67" # make your own secret!
SIGNING_ALGORITHM = "HS256"
now = datetime.now(timezone.utc)

# create payload
payload = {
    "sub": "harry potter",
    "iat": now,
    "exp": now + timedelta(hours=2),
    "nbf": now - timedelta(seconds=5),
    "aud": ACCESS_TOKEN_AUD,
}

# create jwt
encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=SIGNING_ALGORITHM)
```

Your app logic can return the `encoded_jwt` to the user as a HTTP response. 

Likewise, PyJWT's `decode()` function takes a JWT and validates it. Obviously, the function will validate the token's signature. But it'll also make sure the current time is between the `nbf` and `exp` claims. If the token has an `aud` or `iss` claim, `decode()` will check if the token's values are what you expect them to be. If and only if the token passes these validation steps, `decode()` returns the payload as a python dictionary. Otherwise, the function raises a helpful error message to let you know what's wrong with the token. 

```python
# validate jwt and extract payload
payload = jwt.decode(
    encoded_jwt,
    SECRET_KEY,
    algorithms=[SIGNING_ALGORITHM],
    audience=ACCESS_TOKEN_AUD,
)
```

Assuming the token passes validation, your app logic can use the payload to identify the user and proceed. But if the token validation fails, hopefully your app logic does something to notify the user and halt potentially suspicious activity.  

--- 

JWTs are amazing. They live in your browser and silently tell websites who you are, sparing you the pain of repeatedly entering your username and password. And they reduce the chances of someone impersonating you and taking over your online account. 

Do you need help setting up an authorization system with JWT? You know where to [find me](https://kpdata.dev/). And if you're still ordering your midnight snack, order some cookies for me. 
