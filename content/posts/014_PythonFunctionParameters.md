Title: Python Function Parameters
Date: 2025-06-30
Slug: python-function-parameters
Tags: python
Summary: Level up your python functions by using those asterisks and slashes you've been avoiding. 
Status: draft

Yeah, I know. You've been using python for more than a month. You know what a function is. 

Seeing stuff like `def log_message(message, level):` doesn't scare you. 

But what about `def log_message(message, /, timestamp, *, level):`? 

Or how about `def log_message(message, level, *args, **kwargs):`? 

Today, we're digging into function headers. We'll demystify what those asterisks and forward slashes do. Get ready to level up, Pikachu. 

## Level 1: Basics of Parameters
A function is like a faithful robot: you give it some input, it follows a set of instructions, and it returns a result. Like this one:

```python
def log_message(message, level):
    ts_formatted = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts_formatted}] [{level}] {message}")
```

You pass in a `message` and `level`, and a formatted log message is printed. The `message` and `level` are the function's parameters.

Parameters define the bits of info a function expects to receive. Here we pass the arguments "Hello World" and "INFO": 

```python
>>> log_message("Hello World", "INFO")
[2025-06-25 16:30:24] [INFO] Hello World
```

Quick side note: When we <u>define</u> a function, the inputs are called "parameters". But when we <u>call</u> the function, the values we actually input are called "arguments". 

The user needs to pass an argument for each parameter to call the function... except when there's already a default argument.

## Level 2: Default Arguments
Parameters can have default values in the function header. Here's our modifed `log_message`, where `level` has a default argument of "INFO": 

```python
def log_message(message, level="INFO"):
    ts_formatted = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts_formatted}] [{level}] {message}")
```

This makes the function easier to use. The user still has the option to give their own argument, but if they don't give one, the default value you defined is used. Here's what happens when the user enters only 1 of the 2 parameters:

```python
>>> log_message("Hello World")
[2025-06-25 16:30:24] [INFO] Hello World
```

Before you start sprinkling your parameters with default arguments, be warned: Do NOT use a mutable object (like a list or dictionary) as a default argument. 

Default arguments are evaluated when the function is loaded, not when the function is called. 

Here's a function that looks for errors in logged events. A reasonable attempt would be to loop through each log entry and store any errors in a `warnings` list. And someone (not you) would define an empty list (`[]`) as the default argument: 

```python
def process_events(events, warnings=[]):  # DANGER HERE
    for event in events:
        if "error" in event:
            warnings.append(error)
    return warnings
```

It seems tame. But look what happens: 

```python
>>> # 1st batch
>>> events1 = ["ok", "error:missing_field"]
>>> process_events(events1) # expected: ['error:missing_field']
['error:missing_field']
>>> 
>>> # 2nd batch
>>> events2 = ["error:bad_format"]
>>> process_events(events2) # expected: ['error:bad_format'] ... but we get
['error:missing_field', 'error:bad_format']
```

Hmm... How'd the 2nd batch return errors found the 1st batch? Both function calls are sharing the same `warnings` list, which was not intended. That empty list was created when the function was defined, so every function call uses the exact same list object. 

Here's a safer alternative that does what we want:

```python
def process_events(events, warnings=None):
    if warnings is None:
        warnings = []  # this is defined for each function call (if needed)
    for event in events:
        if "error" in event:
            warnings.append(event)
    return warnings
```

Instead of an empty list, we pass `None` as the default argument for `warnings`. In the function logic, if the user doesn't pass a `warnings` argument, we define `warnings` as an empty list at call time. This isolates the default empty list to a single function call (i.e. no shared state between calls).

## Positional or Keyword Parameters
So far, our example parameters have received arguments by either position or keyword. The following function calls are all valid: 

```python
def log_message(message, level):
    ts_formatted = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts_formatted}] [{level}] {message}")

log_message("Hello World", "INFO")                # positional arguments - just give value, not parameter name
log_message(message="Hello World", level="INFO")  # keyword arguments - type "parameter=value"
log_message(level="INFO", message="Hello World")  # keyword arguments (but different order)
log_message("Hello World", level="INFO")          # mixture of positional and keyword arguments
```

When using positional arguments, order matters. The order of the arguments must match the order of the parameters in the function header. 

However, when using keyword arguments, the order doesn't matter. Python will pass the argument to the correct parameter. The only restriction is that keyword arguments must appear after positional arguments.

But sometimes, you want to apply more restrictions on how your function is used. 

## Level 10: Positional-ONLY and Keyword-ONLY Parameters
Let's talk about that `/` and `*` in the function header. These markers force a parameter to be received by position only or by keyword only. 

Here's the punch line: 

[ INSERT DIAGRAM OF FUNCTION HEADER WITH 3 TYPES OF PARAMETERS ]

A parameter before the forward slash can receive an argument only by position, not by keyword. Why would that be useful, you ask? 

Well, maybe the order of arguments is really meaningful. Consider the function `make_point(x, y)` that creates a point in the Cartesian coordinate system. (Did you feel that high school algebra nostalgia?) We know that the x-coordinate is listed before the y-coordinate on paper, so it would be silly to let the user call the function with something like `point(y=-4, x=5)`. To force the x argument to appear before the y argument, we can use the "/" marker: 

```python
def make_point(x, y, /):
    print(f"Point ({x}, {y}) created")
```

Now, if our user tries to switch the order using keyword arguments, they'll get an error: 

```python
>>> make_point(y=-4, x=5)
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    make_point(y=-4, x=5)
    ~~~~~~~~~~^^^^^^^^^^^
TypeError: make_point() got some positional-only arguments passed as keyword arguments: 'x, y'
```

The function will only accept positional arguments, like `make_point(5, -4)`. This is more of a stylistic choice when designing your function. You force your users to pass arguments in a way that avoids confusion. As an added bonus, you can change the the names of the function parameters without breaking any user code. 

Parameters after the `*` marker can receive arguments only by keyword, not by position. This is useful when you want to make users' code more readable, especially when the function has many parameters. Check out this email-sender function: 

```python
def send_email(to, subject, cc, bcc, reply_to):
    ...
```

Now just imagine how a user may use this function: 

```python
>>> send_email('hermione@hogwarts.edu', 'I love you', 'harry@hogwarts.edu', 'molly@alumni.hogwarts.edu', 'ron@hogwarts.edu')
```

Uh... who's CC'd on this email and who's BCC'd? It's hard to tell what each of the parameters mean. Instead, you can force users to use keyword arguments by including the `*` marker. 

```python
def send_email(to, subject, *, cc, bcc, reply_to):
    ...
```

Now, if our function is called without keyword arguments, an error is raised: 

```python
>>> send_email('hermione@hogwarts.edu', 'I love you', 'harry@hogwarts.edu', 'molly@alumni.hogwarts.edu', 'ron@hogwarts.edu')
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    send_email('hermione@hogwarts.edu', 'I love you', 'harry@hogwarts.edu', 'molly@alumni.hogwarts.edu', 'ron@hogwarts.edu')
    ~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
TypeError: send_email() takes 2 positional arguments but 5 were given
```

But the following function call will pass:

```python
>>> send_email('hermione@hogwarts.edu', 'I love you', 
...            cc='harry@hogwarts.edu',
...            bcc='molly@alumni.hogwarts.edu',
...            reply_to='ron@hogwarts.edu')
```

Now it's clear what each argument of the function is for. As a bonus, you can add new parameters in the function header without breaking existing code. Maybe one day, the function will have an "encrypt" parameter. If you force the parameter to receive keyword arguments only, your users' existing code won't break: 

```
def send_email(to, subject, *, encrypt, cc, bcc, reply_to):
    ...
```


1. Use position-only parameters when the order of arguments is important or the parameter names may change. 
2. Use keyword-only parameters to improve readability when the function is used and to add new parameters without breaking existing code. 
3. Use positional-or-keyword parameters when it doesn't make a difference. 

## Level 25: Unpacking Parameters
Sometimes, you want the function to accept a variable number of inputs. Or you don't know how many inputs the function will receive in the wild. In such cases, you use the `*args` parameter to group the inputs into a tuple. The function can then unpack the values in the function body for processing. 

Likewise, sometimes you want the function to accept a varible number of inputs with names, or keywords. These can be received into the function using `**kwargs` in the signature. Any keyword argument passed into the function that are not explicitly declared in the signature are placed into a dictionary and given the name "kwargs". The function can then work on that dictionary within the logic. 

The names "args" and "kwargs" are not required. You can use any variable name, like `*stuff` and `**more_stuff`, but "args" and "kwargs" are the community accepted standard. 


If you've made it this far, here's you prize: A cheatsheet of the various parameter types.

| Parameter Type            | Example Definition         | Must Be Called As  |
| ------------------------- | -------------------------- | ------------------ |
| **Positional-only**       | `def f(a, /)`              | `f(1)`             |
| **Positional-or-keyword** | `def f(a)` or `def f(a=1)` | `f(1)` or `f(a=1)` |
| **Keyword-only**          | `def f(*, a)`              | `f(a=1)`           |
| **Var-positional**        | `def f(*args)`             | `f(1, 2, 3)`       |
| **Var-keyword**           | `def f(**kwargs)`          | `f(a=1, b=2)`      |

