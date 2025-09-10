Title: Python Scope
Date: 2025-09-11
Slug: python-scope
Tags: #python
Summary: Finding a variable can be like a game of finding Waldo. It's important you get the right one.
Status: draft

Some things make you say "WTF?" 

Like when you run a script and get a scary message: 

```pytb
Traceback (most recent call last):
  File "<input>", line 1, in <module>
    x
    ^
NameError: name 'x' is not defined
```

Or something like...

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


Let's talk about Python scope.

I can see your eyes glazing over. But hear me out.

Understand scope and you'll write cleaner and safer code. Your apps will avoid unexpected behavior. It may even make you a badass.

You want to be a badass, so keep reading.

## The Basics
Every variable has a home, a place in the digital neighborhood where it "lives." This is scope. A variable's scope is the area of code where the variable is visible or accessible.

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

That's because `x` exists within its "house" of the function `f1`. You can't reach `x` from outside its house. Variables with local scope can only be accessed within the function (or lambda expression) that define them. After the function runs, the variable ceases to exist.

Global scope, on the other hand, contains variables defined at the top level of your module. It includes variables defined outside of functions, or roaming the streets outside houses. Below, `x` is defined at the top level. And somehow... function `f2` knows how to find it.

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
This raises the question: How does Python determine which `x` to use? (when there's more than one option to choose from)

A search pattern called the LEGB rule is used for scope resolution. When you refer to a name (of a variable, class, or function), Python searches the following scopes in order until a matching name is found. If the name can't be found in any of these locations, a NameError is raised.

1. **L**ocal
2. **E**nclosing
3. **G**lobal
4. **B**uilt-ins

This raises an important concern about naming. Suppose you want to access a function defined in the built-in scope (e.g. `max`). If you accidentally define a function, class, or variable with the same name, you're effectively masking the high-level `max` function. This can cause bugs, so be careful to namespace your custom objects.

Here, the `max` function works as expected... until we create our own `max` function that masks the built-in one. More specifically, when we call `max` again, Python finds a match in our global scope (the one we defined) and stops there. Meanwhile, the original `max` function object still exists in the built-in scope.

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

But fear not, things can be restored. After deleting our `max` function in the global scope, the built-in `max` becomes available again:

```python-console
>>> del(max)  # delete our custom function
>>> max(4, 7)  # try calling the built-in max function again
7
```

Ah... all is right with the world.

Okay, we've seen Local and Global scope. Let's check out Enclosing scope, which typically appears with nested functions.

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

What's going on here? The main function is `f_outer`. Within that, we define another function `f_inner`. You'll notice that `f_inner` is printing variable `x`... without having `x` assigned in its local scope. `x` isn't defined in the global scope either. Instead, `f_inner` first finds `x` in its "enclosing scope," or the local scope of its enclosing function.

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

The outer function `get_collector()` creates an empty list called `series` and returns the inner function `store()`. The `store()` function appends its input `x` into the variable `series` and then returns the number if items in `series`. Of course, `series` is not defined in the inner function `store()`, so following the LEGB rule, the `series` variable found in the enclosing scope (of outer function `get_collector`) is supposedly used.

We can test this. Let's load up our collector:

```python-console
>>> collector("thing1")
1
>>> collector("thing2")
2
>>> collector("thing3")
3
```

Each time we call `collector()`, we're really calling an instance of `store()`. The three calls above show that each call is affecting the same `series` object. 

`store()` is something called a closure. A closure is a function that has access to the variables in its enclosing scope after the code defining the function has run. Such variables are called free. A free variable is not defined in local scope or global scope; it's defined in the enclosing scope.

We can inspect the returned `store()` object to verify its use of variables. The attribute `__code__` represents the compiled function body; this is where we can see the variables used. The attribute `__closure__` stores the contents of free variables in a cell-like structure:

```python-console
>>> collector.__code__.co_varnames  # list local variables
('x',)
>>> collector.__code__.co_freevars  # list free variables
('series',)
>>> collector.__closure__[0].cell_contents  # explore contents of free variables
['thing1', 'thing2', 'thing3']
```

Closures let you retain state between function calls. This reduces the need for classes or global variables to maintain state. The same functionality can be achieved by the class below, but such class definitions be overkill. (Don't tell the [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming) bros I said that.)

```python
class Collector():
    def __init__(self):
        self.series = []

    def store(self, x):
        self.series.append(x)
        return len(self.series)
```

## Built-ins
The final scope Python searches for a name match is the built-ins scope. Unsurprisingly, this is where built-in objects are stored, like `list`, `next`, `Exception`, etc.


## Modifying Scope Rules

[ INSERT SCOPE MOD WITH GLOBAL AND NONLOCAL KEYWORDS ]

- you can't modify objects in enclosing scope from inside a nested function unless you use `nonlocal` statement
- you can't modify global objects inside functions unless you use `global` statement


Don't modify global variables. It's a bad practice and makes debugging difficult. But hey, I'm not your Mom; you live your life and do what you want.

---


