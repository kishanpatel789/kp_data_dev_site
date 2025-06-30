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

Give a `message` and `level`, and a formatted log entry is printed:

```python
>>> log_message("Hello World", "INFO")
[2025-06-25 16:30:24] [INFO] Hello World
```

The `message` and `level` are the function's parameters, or the bits of info the function expects to receive.

Quick side note: When we <u>define</u> a function, the inputs are called "parameters". But when we <u>call</u> the function, the values we actually input are "arguments". 

The user must pass an argument for each parameter to call the function... except when there's already a default argument.

## Level 2: Default Arguments
Parameters can have default values in the function header. Here's our modifed `log_message`, where `level` has a default argument of "INFO": 

```python
def log_message(message, level="INFO"):
    ts_formatted = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts_formatted}] [{level}] {message}")
```

The user has the option to give their own `level`, but if they don't give one, the default value is used. Now the function's a bit easier to use; the user can enter only 1 of the 2 parameters:

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

Hmm... How'd the 2nd call return errors found the 1st batch? Both function calls are sharing the same `warnings` list, which was not intended. That empty list was created when the function was defined, so every function call uses the exact same list object. 

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

Instead of an empty list, `None` is the default argument of `warnings`. In the function logic, if the user doesn't pass a `warnings` argument, we define `warnings` as an empty list at call time. This isolates the default empty list to a single function call (i.e. no shared state between calls).

## Positional or Keyword Parameters
So far, our example parameters have received arguments by either position or keyword. The following function calls are all valid: 

```python
def log_message(message, level):
    ts_formatted = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts_formatted}] [{level}] {message}")

log_message("Hello World", "INFO")                # positional arguments - just type input value, not parameter name
log_message(message="Hello World", level="INFO")  # keyword arguments - type "name=value"
log_message(level="INFO", message="Hello World")  # keyword arguments (but different order)
log_message("Hello World", level="INFO")          # mixture of positional and keyword arguments
```

When using positional arguments, order matters. The argument order must match parameter order in the function header. 

However, when using keyword arguments, the order does not matter. Python will pass the argument to the correct parameter. The only restriction is that keyword arguments must appear after positional arguments.

But sometimes, you want more restrictions on how your function is used. 

## Level 10: Positional-ONLY and Keyword-ONLY Parameters
Let's talk about that `/` and `*` in the function header. These markers force a parameter to be position-only or keyword-only. 

The markers break the function header into three "regions" of parameters: 

<img alt="Parameter map" src="/static/images/post014/ParameterMap.jpeg" class="w-full my-2 md:w-auto md:max-w-2xl mx-auto">

A parameter before the forward slash must receive an argument by position, not by keyword. Why would that be useful, you ask? 

Well, maybe the order of arguments is meaningful. Consider the function `make_point(x, y)` which creates a point in the Cartesian coordinate system. (Did you feel that high school algebra nostalgia?) We know the x-coordinate appears before the y-coordinate on paper, so it would be silly to let the user switch argument order with something like `point(y=-4, x=5)`. To force the x argument to appear before the y argument, we can use the `/` marker: 

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

Parameters after the `*` marker must receive arguments by keyword, not by position. This makes function calls more readable, especially when the function has many parameters. Check out this email-sender function: 

```python
def send_email(to, subject, cc, bcc, reply_to):
    ...
```

Imagine how a user may use this function: 

```python
>>> send_email('hermione@hogwarts.edu', 'I love you', 'harry@hogwarts.edu', 'molly@alumni.hogwarts.edu', 'ron@hogwarts.edu')
```

Uh... who's CC'd on this email and who's BCC'd? It's hard to tell what each argument means. Instead, you can require keyword arguments with the `*` marker. 

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

This version clearly shows what the last few arguments map to. Another benefit is the ability to safely add parameters while avoiding argument-ordering bugs. Maybe one day, the function will have an "encrypt" parameter. If you force the parameter to receive keyword arguments only, your can safely rearrange the order of keyword-only parameters without breaking existing code: 

```python
def send_email(to, subject, *, encrypt, cc, bcc, reply_to):
    # "encrypt" can squeeze in before "cc" since these parameters are keyword-only
    ...
```

When designing the parameter type, remember the following:

1. Use position-only parameters when the order of arguments is important or the parameter names may change in the future.
2. Use keyword-only parameters to improve readability when the function is used and to add new parameters without breaking code. 
3. Use positional-or-keyword parameters when it doesn't make a difference. 

## Level 25: Variable Parameters
Sometimes, you just don't know. You don't how many arguments a function will receive in the wild. Luckily, you can use the `*args` parameter to group extra positional arguments into a tuple:

```python
>>> def func(x, y, *args):
...     print(f"{x=}, {y=}, {args=}")
... 
>>> func(1, 2, 3, 4, 5)
x=1, y=2, args=(3, 4, 5)
```

Notice our function has positional parameters `x` and `y`. But when we called the function, we passed 5 arguments. Python took the first two positional arguments and gave them to `x` and `y`; the rest of the positional arguments were shoved into a tuple called `args`. 

Likewise, sometimes your function needs to receive a variable number of keyword arguments. Use the `**kwargs` parameter to gather extra keyword arguments into a dictionary: 

```python
>>> def func(x, y, **kwargs):
...     print(f"{x=}, {y=}, {kwargs=}")
... 
>>> func(1, 2, a=3, b=4, c=5)
x=1, y=2, kwargs={'a': 3, 'b': 4, 'c': 5}
```

Again, `x` and `y` are declared positional parameters. But this time, we're passing some keyword arguments not defined in the function header. Python will capture these undeclared keyword arguments and store them in a dictionary called `kwargs`.

Note: The parameter names "args" and "kwargs" are not required. You can use any variable name, like `*stuff` and `**more_stuff`, but "args" and "kwargs" are the community accepted standard. It's the unpacking operator (`*` and `**`) before the parameter name that performs the magic. 

Here's a more practical example of how variable arguments can enhance our `log_message` function. `*messages` and `**metadata` join the team: 

```python
def log_message(*messages, level="INFO", **metadata):
    ts_formatted = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    meta_str = " ".join(f"{k}={v}" for k, v in metadata.items())
    for message in messages:
        print(f"[{ts_formatted}] [{level}] {message} {meta_str}")
```

Now `log_message` can receive multiple messages that need to be logged. Any extra information is passed as keyword arguments and stored in `metadata`. 

```python
>>> log_message(
...     "Disk usage at 85%",
...     "Auto-scaling triggered",
...     level="WARNING",
...     instance="vm-123",
...     region="us-east-1",
... )
[2025-06-30 15:52:01] [WARNING] Disk usage at 85% instance=vm-123 region=us-east-1
[2025-06-30 15:52:01] [WARNING] Auto-scaling triggered instance=vm-123 region=us-east-1
```

---

Whew! If you've made it this far, here's your prize: A cheatsheet of the various parameter types.

| Parameter Type            | Example Definition         | Must Be Called As  |
| ------------------------- | -------------------------- | ------------------ |
| **Positional-only**       | `def f(x, /)`              | `f(1)`             |
| **Positional-or-keyword** | `def f(x)` or `def f(x=1)` | `f(1)` or `f(x=1)` |
| **Keyword-only**          | `def f(*, x)`              | `f(x=1)`           |
| **Variable Positional**   | `def f(*args)`             | `f(1, 2, 3)`       |
| **Variable Keyword**      | `def f(**kwargs)`          | `f(x=1, y=2)`      |

In most cases, letting your parameters be positional-or-keyword is fine. However, enhancing functions with other parameter types can make larger modules more weatherproof for what life (i.e. users) may throw at it. 

What other ways do you use function parameters? Give me a [shout](https://kpdata.dev/) if you want help taking your functions to the next level. 

