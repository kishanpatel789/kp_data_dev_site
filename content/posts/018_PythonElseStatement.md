Title: Python Else Statement
Date: 2025-11-21
Slug: python-else-statement
Tags: python
Summary: Where can the `else` statement be used? We'll go beyond the if-statement to see everywhere Python allows `else`.
Status: draft

I thought I knew it all.

So when Bruno said, "Throw an `else` at the end of that for-loop," I thought he was crazy.

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


<div class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div class="w-full md:w-[48%]">

Version 1

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
<div class="w-full md:w-[48%]">

Version 2

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

One use case of the for-else block is searching for a target. Suppose we need to see if a list of users contains an "admin" user or not.

Let's define our `User` class:

```python
from dataclasses import dataclass

@dataclass
class User:
    name: str
    is_admin: bool
```

Now let's search two lists for an admin user:



<div class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div class="w-full md:w-[48%]">

Search 1

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
<div class="w-full md:w-[48%]">

Search 2

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

In Search 2, we never hit the `break` statement because we never found a user with `is_admin=True`. As a result, the `else` block is allowed to run, telling us what happened.

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

But this requires the creation of a separate variable `admin_found` and another if-statement to check whether an admin was found. The for-else performs the same logic more concisely!

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

Now consider two versions of a while block:


<div class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div class="w-full md:w-[48%]">

Version 1: traditional while-loop with boolean flag

```python
attempts_made = 0
success = False

while attempts_made < 3:
    print("Attempting to connect...")
    if connect_to_server() == "success":
        success = True
        print("Connected to server!")
        break
    attempts_made += 1
    time.sleep(1)

if not success:
    raise TimeoutError("Failed to connect to server after 3 attempts")
```

```python-console
Attempting to connect...
Attempting to connect...
Attempting to connect...
Traceback (most recent call last):
  File "<input>", line 9, in <module>
    raise TimeoutError("Failed to connect to server after 3 attempts")
TimeoutError: Failed to connect to server after 3 attempts
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div class="w-full md:w-[48%]">

Version 2: while-else approach

```python
attempts_made = 0

while attempts_made < 3:
    print("Attempting to connect...")
    if connect_to_server() == "success":
        print("Connected to server!")
        break
    attempts_made += 1
    time.sleep(1) # wait 1 second before trying again
else:
    raise TimeoutError("Failed to connect to server after 3 attempts")
```

```python-console
Attempting to connect...
Attempting to connect...
Attempting to connect...
Traceback (most recent call last):
  File "<input>", line 9, in <module>
    raise TimeoutError("Failed to connect to server after 3 attempts")
TimeoutError: Failed to connect to server after 3 attempts
```

</div>
</div>

PICK UP HERE



The while-else structure clearly separates the successful path (where the loop breaks early) from the failure path (where the loop completes normally).



else statement only if condition becomes "falsey" (i.e. no break statement found)

use case: attempt to connect to server up to a limited number of tries
- waiting on job to complete, waiting on network resource to be available, retrying api calls


## 4. The "try-except" Block
try-except-else-finally

When in a try-except block, the else statement only runs if no exception is raised in try block. used to do something if the try block runs successfully

the except clause doesn't catch any raised Exceptions.

## Wrap up
else statement is skipped if an exception is raised or if interpreter meets a return/break/continue statement that causes control to jump out of main block
else is a poor name. Instead of "run this loop, otherwise do that", it's more like "run this loop, THEN do that"

Perhaps a better name would've been "nobreak" or "noexception"

Here's your cheatsheet of where the `else` statement appears.

Call me... or else.

