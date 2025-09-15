Title: Python Scope
Date: 2025-09-12
Slug: python-scope
Tags: python
Summary: Life's good until you hit that NameError or UnboundLocalError. Avoid unnecessary pain by mastering Python scope.
Status: published
MetaImage: /static/images/post016/LEGBThumbnail.jpg

Some things make you say "WTF?" 

Like when you run a script and get this: 

```pytb
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    x
    ^
NameError: name 'x' is not defined
```

Or something cryptic like...

```pytb
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    my_counter()
    ~~~~~~~~~~^^
  File "<input>", line 4, in update_counter
    count += 1
    ^^^^^
UnboundLocalError: cannot access local variable 'count' where it is not associated with a value
```

These errors come out of nowhere. They ruin a smooth coding session. But these errors can be avoided.

We need to talk about Python scope.

I can see your eyes glazing over. But hear me out.

Understand scope, and you'll write cleaner and safer code. Your apps will avoid unexpected behavior. It may even make you a badass.

You want to be a badass. So keep reading.

## The Basics
Every variable has a home, a place where it "lives." This is scope. 

A variable's scope is the area of code where the variable is visible or accessible.

Take this example:

```python-console
>>> def f1():
...     x = "hello"
...     print(x)
...
>>> f1()
hello
```

Simple right? The function creates a variable `x` and then prints it. `x` has a local scope and is accessible within the function. Calling `x` outside the function gives a NameError.

```python-console
>>> x  # calling 'x' outside the function!
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    x  # calling 'x' outside the function!
    ^
NameError: name 'x' is not defined
```

That's because `x` exists within its "house" of the function `f1`. You can't reach `x` from outside its house. Variables in local scope can only be accessed within the function (or lambda expression) that define them. After the function runs, the variable ceases to exist.

Global scope, on the other hand, contains variables defined at the top level of the module. Below, `x` is defined outside any function. And somehow... function `f2` knows how to find it.

```python-console
>>> x = "hola"  # define 'x' outside the function
>>> def f2():
...     print(x)
...
>>> f2()
hola
```

`x` is not defined in `f2`'s function parameters or assigned a value in the function body. Yet the function is able to reach into the global scope to discover that `x` is tied to "hola". Python's like a kid looking for his favorite toy. It looks for the variable in its local scope first (his house). If the variable isn't there, he goes outside to continue the search.

If there are separate `x` variables in both local and global scope, Python will use the one in local scope:

```python-console
>>> x = "hola"  # define 'x' outside the function
>>> def f3():
...     x = "hello"  # define another 'x' inside the function
...     print(x)
...
>>> f3()
hello
```

## Scope Resolution
This raises the question: How does Python determine which `x` to use? (when there's more than one option)

A search pattern called the "LEGB Rule" is used for scope resolution. When you refer to a name (of a variable, class, or function), Python searches the following scopes <u>in order</u> until a matching name is found. If the name can't be found in any of these locations, a NameError is raised.

1. **L**ocal
2. **E**nclosing
3. **G**lobal
4. **B**uilt-in

The final scope Python searches for a name match is the built-in scope. Unsurprisingly, this scope contains built-in objects, like `list()`, `open()`, `Exception`, etc.

Because of LEGB, we need to be careful when naming things. Suppose you want to access a function defined in the built-in scope (e.g. `max()`). If you accidentally define a function, class, or variable with the same name, you're effectively masking the high-level `max` function. This can cause surprising bugs.

Here, the `max` function works as expected... until we create our own `max` function that masks the built-in one. More specifically, when we call `max` again, Python finds a match in our global scope (the one we defined) and stops there. 

```python-console
>>> max(4, 7)  # run the built-in max function
7
>>> def max():  # create your own function
...     print("haha, I'm replacing the built-in max function!")
...
>>> max(4, 7)  # try calling the built-in max function again
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    max(4, 7)  # try calling the built-in max function again
    ~~~^^^^^^
TypeError: max() takes 0 positional arguments but 2 were given
```

But fear not, things can be restored. The original `max` function object still exists in the built-in scope; it's just inaccessible due to the `max` in our global scope. After deleting our `max` function in the global scope, the built-in `max` becomes available again:

```python-console
>>> del(max)  # delete our custom function
>>> max(4, 7)  # try calling the built-in max function again
7
```

Ah... all is right with the world.

Okay, we've seen Local, Global, and Built-in scope. Let's check out Enclosing scope, which typically appears with nested functions.

## Enclosing Scope
Below we have a dream within a dream... I mean a function within a function.

```python-console
>>> def f_outer():
...     x = "hola"
...     def f_inner():
...         print(f"Printing from inner: {x}")
...     f_inner()
...     print(f"Printing from outer: {x}")
...
>>> f_outer()
Printing from inner: hola
Printing from outer: hola
```

What's going on here? The main function is `f_outer`. Within that, we define another function `f_inner`. You'll notice that `f_inner` is printing variable `x`... without having `x` assigned in its local scope. `x` isn't defined in the global scope either. Instead, `f_inner` finds `x` in its "enclosing scope," or the local scope of its enclosing function.

This example is admittedly contrived. Let's see a more useful example.

Here's a function that gives you something to store your stuff:

```python-console
>>> def get_collector():
...     series = []
...     def store(x):
...         series.append(x)
...         return len(series)
...     return store
...
>>> collector = get_collector()
```

The outer function `get_collector()` creates an empty list called `series` and returns the inner function `store()`. The `store()` function appends its input `x` to the variable `series` and returns the number of items in `series`. Of course, `series` is not defined in the inner function `store()`, so following the LEGB rule, the `series` variable found in the enclosing scope (of outer function `get_collector`) is supposedly used.

We can test this. Let's load up our collector:

```python-console
>>> collector("thing1")
1
>>> collector("thing2")
2
>>> collector("thing3")
3
```

Each time we call `collector()`, we're really calling an instance of `store()`. The three calls above show that each call is affecting the same `series` object. After the final call, we're told there are 3 items in `series`.

`store()` is something called a "closure." A closure is a function that is packaged with its enclosing scope. It can continue accessing the outer function's variables even after the outer function has run. 

Closures commonly use two kinds of variables: local and free. Local variables are defined in the inner function like normal. A free variable is not defined in local scope or global scope; it's defined in the enclosing scope.

We can inspect the variables on the `collector` object. The attribute `__code__` represents the compiled function body; this is where we can see the variables used. And the attribute `__closure__` stores the contents of free variables in a cell-like structure:

```python-console
>>> collector.__code__.co_varnames  # list local variables
('x',)
>>> collector.__code__.co_freevars  # list free variables
('series',)
>>> collector.__closure__[0].cell_contents  # explore contents of free variables
['thing1', 'thing2', 'thing3']
```

Closures are very helpful! They let you retain state between function calls. This reduces the need for classes or global variables to maintain state. The same functionality could be achieved by the class below, but such class definitions be overkill. (Don't tell the [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming) bros I said that.)

```python
class Collector():
    def __init__(self):
        self.series = []

    def store(self, x):
        self.series.append(x)
        return len(self.series)
```


## Modifying Scope Rules

So far, we've talked about **reading** variables outside local scope. But what if we want to **change** variables outside local scope? Let's give it whirl: 

```python-console
>>> counter = 0    # here's a global variable
>>> def update_counter():
...     counter = counter + 1    # try updating global variable
...
>>> update_counter()
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    update_counter()
    ~~~~~~~~~~~~~~^^
  File "<input>", line 2, in update_counter
    counter = counter + 1
              ^^^^^^^
UnboundLocalError: cannot access local variable 'counter' where it is not associated with a value
```

Oops... I did it again. Here's what Python thought about the line `counter = counter + 1`. When the interpreter reads the file, it sees `counter` is assigned to some object (left side of `=`); it thinks, "Oh, `counter` should be a local variable" as it compiles the function body. Later when the function is executed, Python sees a reference to `counter` (right side of `=`); because it's logged `counter` is a local variable, the interpreter searches the local scope only... to find `counter` doesn't exist. That's what the UnboundLocalError message is saying.

But our intent was to update the global `counter`. It turns out you can't modify global objects while within a function. That's the default rule. And it's a good rule. Because you don't want your functions modifying global variables that other parts of your code depend on. That makes debugging a nightmare. 

But if you like living dangerously, you can stray from the safe path: Use the `global` keyword within your function.

```python-console
>>> counter = 0
>>> def update_counter():
...     global counter   # tell Python we're talking about the global 'counter'
...     counter = counter + 1
...
>>> update_counter()
>>> counter  # check value
1
```

Near the top of the function, list the variables that should be accessed from the global scope. When the function attempts to modify those variables, it will affect the globally scoped variable instead of making a new local variable.

Again, modifying global variables from within a function is bad practice. But hey, I'm not your mom; you live your life and do what you want.

There's a similar story about changing variables in an enclosing scope from within an inner function:

```python-console
>>> def get_counter():
...     count = 0
...     def counter():
...         count = count + 1  # try updating variable in enclosing scope
...     return counter
...
>>> update_counter = get_counter()   # increment the count
>>> update_counter()
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    update_counter()
    ~~~~~~~~~~~~~~^^
  File "<input>", line 4, in counter
    count = count + 1  # try updating variable from enclosing scope
            ^^^^^
UnboundLocalError: cannot access local variable 'count' where it is not associated with a value
```

Like before, since we're assigning `count` in the inner function, Python recognizes `count` as a local variable. But when attempting to reference `count` for the first time (`count + 1`), the interpreter recognizes `count` doesn't exist in local scope. We get the same UnboundLocalError. 

Use the `nonlocal` keyword to modify variables in the enclosing scope. By saying `nonlocal count`, you're telling Python that you want to update the outer function's `count`:

```python-console
>>> def get_counter():
...     count = 0
...     def counter():
...         nonlocal count  # tell Python we want the enclosing 'count'
...         count = count + 1
...     return counter
...
>>> update_counter = get_counter()
>>> update_counter()   # increment the count
>>> update_counter.__closure__[0].cell_contents  # check value
1
```

Here's a summary of the modification rules:

- You can't modify objects in enclosing scope from within an inner function unless you use the `nonlocal` statement.
- You can't modify global objects from within functions unless you use the `global` statement.

---

There you go, you badass. Tattoo "LEGB" on your arm. You now see how names are found in Python. Our discussion focused on variable names, but the same scope rules apply to class and function names too.

Improve the long-term maintainability of a project by keeping scope in mind. Proper scope usage reduces naming conflicts and improves code organization. Most importantly, it ensures the proper variable gets used.

Are you pestered by NameErrors and UnboundLocalErrors? [Reach out](https://kpdata.dev/) for help squashing those bugs.
