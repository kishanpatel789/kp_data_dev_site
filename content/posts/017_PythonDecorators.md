Title: Python Decorators
Date: 2025-10-09
Slug: python-decorators
Tags: python
Summary: You've seen that @ symbol but aren't sure what it does. It's time to unravel the Python decorator.
Status: draft

It's fall. 

My neighbors are decorating their yards with pumpkins, fake leaves, and enough Halloween skeletons to fill a graveyard.

Me? I'm decorating functions. 

And let me tell ya... they're looking beautiful.

Today we're getting a Martha-Stewart-crash-course in Python decorators.

Grab your pumpkin-spiced whatever and enjoy the hay ride.


## Basics
Let's get right to it: A decorator is a function that takes another function and returns a function.

Whoa, whoa, whoa... let's break that down. We'll simplify by looking at two functions.

Function 1 is `my_func`; it just prints something.

```python
# my original function
def my_func():
    print("Hello world")
```

Function 2 is `my_decorator`. It has one parameter (`func`) and does two things:

1. Define an inner function `wrapper` that calls the input function `func`
2. Return that inner function

```python
# my decorator function - receives a function and returns another function
def my_decorator(func):
    def wrapper():  # 1. define an inner function
        print("Before function call")
        func()          # run input function
        print("After function call")
    return wrapper  # 2. return that inner function
```

One function will decorate the other. Decoration happens when you pass the original function `my_func` to the decorator `my_decorator`, like this: `my_decorator(my_func)`. 

Remember, `my_decorator` returns the inner function `wrapper`, which we conveniently reassign to the name `my_func`:

```python
# decorate the original function
my_func = my_decorator(my_func)
```

Let's run the updated `my_func`:

```python-console
>>> my_func()
Before function call
Hello world
After function call
```

Amazing! The original `my_func` just printed "Hello world". But the decorated version prints something before and after that. That's the point of decorators. They extend an existing function in some way.

Back to the definition: A decorator is...

- a function (`my_decorator`) ...
- that takes another function (`my_func`) ...
- and returns a function (`wrapper`).

Along the way, the original function's behavior is extended or modified.

In practice, we use the `@` syntax to decorate the original function. Just throw the decorator name above the original function definition. The two versions below are equivalent:

<div class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div class="w-full md:w-[48%]">

```python
def my_func():
    print("Hello world")

my_func = my_decorator(my_func)
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div class="w-full md:w-[48%]">

```python
@my_decorator
def my_func():
    print("Hello world")
```

</div>
</div>

Naturally you may wonder, "So what? Why don't I just modify the original function directly?"

Answer: Decorators let you extend MANY functions without re-writing the same code over and over again (the [DRY principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)). 

Here are common use cases for decorators:

- Register functions with a central registry (think FastAPI or Flask routes)
- Test the performance of functions by timing them
- Restrict function calls to users with certain permissions (think Django permissions system)
- Emit logs each time functions are called (for auditing)
- Filter the inputs and outputs of functions
- Cache the output of a function for reuse
- Limit how often functions can be called (to avoid API throttling)

The list goes on and on. You're limited only by your imagination.

We'll explore the mechanics of decorators that enable such use cases.

## Example 1: Modify Output
That first decorator was boring. Let's spice it up.

```python
def yell(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return f"{result.upper()}!!!"
    return wrapper
```

This decorator modifies a function that returns a string. It makes the output uppercase and throws exclamation points at the end.

<div class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div class="w-full md:w-[48%]">

Here's a function to decorate. By itself, it's tame:

```python-console
>>> def cast_spell(spell_name: str) -> str:
...     print("Raising wand...")
...     return spell_name
...
>>> cast_spell("lumos")
Raising wand...
'expecto patronum'
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div class="w-full md:w-[48%]">

But stick a decorator on top of that function...

```python-console
>>> @yell
... def cast_spell(spell_name: str) -> str:
...     print("Raising wand...")
...     return spell_name
...
>>> cast_spell("lumos")
Raising wand...
'EXPECTO PATRONUM!!!'
```

And now those dementors are trembling.

</div>
</div>


We instantly changed the original function's return value. To do that, we designed `yell`'s wrapper function to receive any number of arguments. `wrapper` has two parameters in its signature: `*args` and `**kwargs`. (If you're unfamiliar with these parameters, check out this [post on Python function parameters](https://kpdata.dev/blog/python-function-parameters/).) Within `wrapper`, we call the original function (aliased as `func`) and store the response in a variable `result`. The uppercase version of `result` is returned with exclamation points.

Bad news. In all this excitement, we lost something. Let's inspect the characteristics of `cast_spell`. 

<div markdown=1 class="flex flex-col md:flex-row md:space-x-2 md:gap-2 py-2 items-stretch">
<div markdown=1 class="w-full md:w-[48%]">

We see the object that `cast_spell` points to, the type annotations, and the doc string:

```python-console
>>> def cast_spell(spell_name: str) -> str:
...     """Aim wand and emit incantation."""
...     print("Raising wand...")
...     return spell_name
...
>>> cast_spell  # points to a function object
<function cast_spell at 0x7377eef665c0>
>>> cast_spell.__annotations__
{'spell_name': <class 'str'>, 'return': <class 'str'>}
>>> cast_spell.__doc__
'Aim wand and emit incantation.'
```

</div>
<div class="hidden md:block w-px bg-gray-300"></div>
<div markdown=1 class="w-full md:w-[48%]">

But when we decorate with `@yell`, the name `cast_spell` now points to the `wrapper` function... and we lose our type hints and documentation:

```python-console
>>> @yell
... def cast_spell(spell_name: str) -> str:
...     """Aim wand and emit incantation."""
...     print("Raising wand...")
...     return spell_name
...
>>> cast_spell   # wait, what's wrapper?
<function yell.<locals>.wrapper at 0x7377eef90d60>
>>> cast_spell.__annotations__
{}
>>> cast_spell.__doc__ # returns None
>>>
```

</div>
</div>

Our code is less usable without this metadata, especially when it's time to debug. To retain the metadata of the original function, we can use yet another decorator from the standard libary: `functools.wraps`. It's main purpose is to make the `wrapper` function look like the function it's wrapping.

```python
from functools import wraps

def yell(func):
    @wraps(func)  # make `wrapper` "look" like `func`
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return f"{result.upper()}!!!"
    return wrapper
```

And just like that, the decorated function keeps the original function's metadata:

```python-console
>>> @yell
... def cast_spell(spell_name: str) -> str:
...     """Aim wand and emit incantation."""
...     print("Raising wand...")
...     return spell_name
...
>>> cast_spell
<function cast_spell at 0x7377eef909a0>
>>> cast_spell.__annotations__
{'spell_name': <class 'str'>, 'return': <class 'str'>}
>>> cast_spell.__doc__
'Aim wand and emit incantation.'
```

## Example 2: Performance Profiling
If you're lucky, your functions are efficient every time. If you're like me, you need to wade through your code to figure out which part is taking so long. 

You could throw a series of `time.perf_counter()` calls around suspect sections of code. Or you could design a custom decorator to profile your functions. Here's a decorator `tictoc` that does three things: 

1. Start the clock
2. Run the original function
3. Stop the clock and print the run time

```python
import time

def tictoc(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter() # log start time
        func(*args, **kwargs)       # run original function
        end = time.perf_counter()   # log end time
        print(f"Function '{func.__name__}' ran in {end-start:.3f} seconds")
    return wrapper
```

This decorator can be used to profile the time performance of any function: 

```python-console
>>> @tictoc
... def troublesome_function(name: str):
...     time.sleep(5)
...     print(f"Hey {name}, I'm done working now!")
...
>>> troublesome_function("Albus")
Hey Albus, I'm done working now!
Function 'troublesome_function' ran in 5.013 seconds
```

## Example 3: Limit Function Calls by Retaining State

In a dream world, you can call an API as many times as you want. In the real world, that API will cut off you off quicker than a bartender. 

APIs have limits they place on each user. As a user, you need to keep track of how often you've called the API. 

One option is to create a custom object to log the count of API calls. Another option is... (you guessed it) a decorator!

```python
import time

def rate_limit(func):
    last_called = 0
    def wrapper(*args, **kwargs):
        nonlocal last_called
        now = time.time()
        if now - last_called <= 10:   # check if 10 seconds have passed
            raise Exception("Rate limit exceeded; wait 10 seconds")
        last_called = now
        return func(*args, **kwargs)
    return wrapper
```

This one's a bit more advanced. 
PICK UP HERE

```python-console
>>> @rate_limit
... def call_api(endpoint: str):
...     print(f"Calling '{endpoint}'...")
...
>>> call_api("/owl-post/hedwig")
Calling '/owl-post/hedwig'...
>>> call_api("/owl-post/hedwig") # call again within 10 seconds
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    call_api("/owl-post/hedwig") # call again within 10 seconds
    ~~~~~~~~^^^^^^^^^^^^^^^^^^^^
  File "<input>", line 7, in wrapper
    raise Exception("Rate limit exceeded; wait 10 seconds")
Exception: Rate limit exceeded; wait 10 seconds
```

## Example 4: Parameterized Decorator - 3 levels deep - DEFINITELY DO THIS ONE - eg repeat





## way later
We've focused on functions. But really, decorators apply to any callable object, not just functions. The true definition of a decorator: A decorator is callable that takes a callable and returns another callable. This means decorators be classes or apply to classes... but that's a post for another day.


