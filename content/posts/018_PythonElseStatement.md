Title: Python Else Statement
Date: 2025-11-21
Slug: python-else-statement
Tags: python
Summary: Where can the `else` statement be used? We'll go beyond the if-statement to see everywhere Python allows `else`.
Status: draft

I thought I knew it all.

So when Bruno said, "Throw an `else` at the end of that **for-loop**," I thought he was crazy.

Everyone knows `else` appears in if-statements, not for-loops, right?

Turns out I was wrong. I skeptically placed `else` after my for-loop... and it worked.

Then began my existential crisis. "What else am I wrong about in Python?" 

"What else does `else` do?" I wondered.

This one's for you Pythonistas out there who thought `else` was limited to if-statements.

We'll look at the 4 places Python allows the `else` statement.

## 1. The "if" Statement
No big revelation here: You can use `else` in an if-statement.

```python
if something_is_true:
    print("do something")
else:
    print("do something else")
```

The if-else statement is the proverbial fork-in-the-road. If something is true, take path A. If not, take path B.

This is the OG of `else` statements.

## 2. The "for" Loop
News flash: You can use `else` statements after a for-loop. Take a look at this example. There are two versions of the for-loop. What do you think the output will be?


<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

**Version 1**: Standard for-else block

```python
broomsticks = ["Nimbus 2000", "Firebolt", "Comet"]

for broomstick in broomsticks:
    print(broomstick)
else:
    print("HIT THE ELSE STATEMENT")
```

The output is...

```text
Nimbus 2000
Firebolt
Comet
HIT THE ELSE STATEMENT
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

**Version 2**: A for-else block with `break`

```python
broomsticks = ["Nimbus 2000", "Firebolt", "Comet"]

for broomstick in broomsticks:
    print(broomstick)
    if broomstick == "Firebolt": # check to break
        break
else:
    print("HIT THE ELSE STATEMENT")
```

But this time, we get...

```text
Nimbus 2000
Firebolt
```

</div>
</div>

Did you catch it? The `else` statement only runs if the loop does not run into a `break` command. Said differently, the `else` statement only runs if the for-loop is allowed to run to completion.

Both Version 1 and Version 2 attempt to loop through a list of 3 broomsticks. With each iteration of the loop, the broomstick is printed. Version 2, however, performs an extra step of checking if the current broomstick is "Firebolt"; if so, the interpreter reaches a `break` command and the for-loop stops. This is why the `else` statement of Version 2 never runs.

That's cool, but where would we ever use a for-else block?

One use case is searching for a target. Suppose we need to see if a list of users contains an "admin" user or not.

Let's define our `User` class:

```python
from dataclasses import dataclass

@dataclass
class User:
    name: str
    is_admin: bool
```

Now let's search two lists for an admin user:

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

**Search 1**: Three users (1 is admin)

```python
users = [
    User(name="Harry", is_admin=False),
    User(name="Ron", is_admin=False),
    User(name="Hermione", is_admin=True), # admin!
]
```

```python-console
>>> for user in users:
...     if user.is_admin:
...         print(f"Found one admin: {user}")
...         break
... else:
...     print("No admin user found!")
...
Found one admin: User(name='Hermione', is_admin=True)
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

**Search 2**: Two users (0 admins)

```python
users = [
    User(name="Harry", is_admin=False),
    User(name="Ron", is_admin=False),
    # User(name="Hermione", is_admin=True), # no admin
]
```

```python-console
>>> for user in users:
...     if user.is_admin:
...         print(f"Found one admin: {user}")
...         break
... else:
...     print("No admin user found!")
...
No admin user found!
```

</div>
</div>

Both for-else blocks are the exact same. The only thing that differs is the `users` list. In Search 2, we never hit the `break` statement because we never find a user with `is_admin=True`. As a result, the for-loop runs to completion, and the `else` block is allowed to run, telling us what happened.

Such searches don't require a for-else block. We could create a boolean flag to signal if an admin has been found or not, like this:

```python
admin_found = False # flag to store success or failure

for user in users:
    if user.is_admin:
        print(f"Found one admin: {user}")
        admin_found = True  # update flag - we found admin!
        break

if not admin_found:
    print("No admin user found!")
```

But this requires an extra variable `admin_found` and another if-statement to check whether an admin was found. The for-else performs the same logic more concisely!

## 3. The "while" Loop

You can also use an `else` statement after a while-loop. 

The behavior is the same as a for-loop: The `else` statement only runs if the while-loop runs to completion without a `break` statement.

Consider an example: We need to connect to a server and retry if our attempts fail.

Here's some boilerplate code to simulate connecting to a server:

```python
import time

def connect_to_server():
    return "fail"
```

We'll use a while-loop to try connecting to the server. If the attempt fails, we'll wait one second before trying again. After 3 attempts, the while-loop will end. 

Consider two versions of this while-loop:

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

**Version 1**: The traditional while-loop with boolean flag

```python
attempts_made = 0
success = False

while attempts_made < 3:
    attempts_made += 1
    print(f"Connecting to server (attempt {attempts_made})...")
    if connect_to_server() == "success":
        success = True
        print("Connected to server!")
        break
    time.sleep(1) # wait 1 second before trying again

if not success:
    raise TimeoutError("Failed to connect to server after 3 attempts")
```

Output:

```python-console
Connecting to server (attempt 1)...
Connecting to server (attempt 2)...
Connecting to server (attempt 3)...
Traceback (most recent call last):
  File "<input>", line 9, in <module>
    raise TimeoutError("Failed to connect to server after 3 attempts")
TimeoutError: Failed to connect to server after 3 attempts
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

**Version 2**: The while-else approach

```python
attempts_made = 0

while attempts_made < 3:
    attempts_made += 1
    print(f"Connecting to server (attempt {attempts_made})...")
    if connect_to_server() == "success":
        print("Connected to server!")
        break
    time.sleep(1) # wait 1 second before trying again
else:
    raise TimeoutError("Failed to connect to server after 3 attempts")
```

Output:

```python-console
Connecting to server (attempt 1)...
Connecting to server (attempt 2)...
Connecting to server (attempt 3)...
Traceback (most recent call last):
  File "<input>", line 9, in <module>
    raise TimeoutError("Failed to connect to server after 3 attempts")
TimeoutError: Failed to connect to server after 3 attempts
```

</div>
</div>

The results of both while-loops are the same. After 3 attempts, a `TimeoutError` is raised. Like the last for-loop example, Version 1 requires a separate boolean variable and an if-statement to manage the outcome. Version 2's while-else structure clearly separates the successful path (where the loop breaks early) from the failure path (where the loop completes normally).

A lot of this comes down to individual preference. Some people prefer the additional variable and if-statement of Version 1. Others like the concise while-else block in Version 2 with two indented paths. You pick whichever you want. I'm not your mother; I'm just giving you options.

This while-else pattern can also be used while waiting on a background job to complete, waiting on a network resource to be available, or to retry API calls a limited number of times.

## 4. The "try-except" Block
Somethings things go wrong. Python's "try-except" block let us handle failures more gracefully. 

A basic try-except block goes like this: 

1. "try" to run this code...
2. but if you catch an Exception (i.e. the code fails somewhere), run the `except` block. 

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

**Version 1**: The happy path

```python
try:
    print("in try block")
except:
    print("in except block - something went wrong!")
```

Output:

```python-console
in try block
```

In Version 1, the `try` section runs successfully with no errors. This is why the `except` section is not executed.

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

**Version 2**: Something goes wrong

```python
try:
    print("in try block")
    raise ValueError # simulate an exception
except:
    print("in except block - something went wrong!")
```

Output:

```python-console
in try block
in except block - something went wrong!
```

In Version 2, we simulate an Exception by raising `ValueError` in the `try` section. The interpreter  looks for an `except` block that catches `ValueError`. Here, we have a generic `except` block that captures all exceptions and prints that something went wrong. 

</div>
</div>



Now let's add a 3rd layer to the try-except block: the `else` section! The `else` statement only runs if no exception is raised in `try` block. 

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

**Version 1**: The happy path again

```python
try:
    print("in try block")
except ValueError:
    print("in except block - reached a ValueError")
else:
    print("HIT THE ELSE STATEMENT - no ValueError")
```

Output:

```python-console
in try block
HIT THE ELSE STATEMENT - no ValueError
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

**Version 2**: Something goes wrong again

```python
try:
    print("in try block")
    raise ValueError # simulate an exception
except ValueError:
    print("in except block - reached a ValueError")
else:
    print("HIT THE ELSE STATEMENT - no ValueError")
```

Output:

```python-console
in try block
in except block - reached a ValueError
```

</div>
</div>

The `else` section is ideal for running follow-up code if the `try` section runs successfully. It's useful when you want to separate code that might fail (in `try` block) from code that should only run when everything goes well (`else` block).

Here are more realistic examples. : 

eg. database error with sqlite3, filenotfound

We could add a 4th layer to the try-except called `finally`, but that's a post for another day.

--- 

There you have it! The `else` statement can be used in exactly 4 locations in Python. 

Here's your cheatsheet of where the `else` statement appears.

else statement is skipped if an exception is raised or if interpreter meets a return/break/continue statement that causes control to jump out of main block
else is a poor name. Instead of "run this loop, otherwise do that", it's more like "run this loop, THEN do that"

Perhaps a better name would've been "nobreak" or "noexception"


Call me... or else.

