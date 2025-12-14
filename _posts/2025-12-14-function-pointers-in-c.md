---
layout: default
title: "Function Pointers In C"
date: 2025-12-15
---

# Function Pointers in C 

Function pointers in C are a powerful tool, often serving as the bedrock for callbacks, event handlers, and polymorphism in C. They allow us to pass functions into different structures or other functions as data.

A classic example of this lives in `glibc` within `stdlib.h`. The `qsort` function signature looks like this:

```c
void qsort(void *base, size_t nel, size_t width,
           int (*compar)(const void *, const void *));
```

We can see in the last argument: `int (*compar)(const void *, const void *);`.

**What does this actually mean?**
It declares a parameter named `compar`. This parameter is a **pointer** `*` to a function. This function takes two arguments both `const void *`and returns an integer `int`. `qsort` doesn't know *how* to compare your data; it just knows it can call the address stored in `compar` to find out if element A is bigger than element B.

## The Syntax 

C function pointer syntax can be abstract looking at them at the first time, but once you understand how to declare them. It's really easy to remeber.

Here is the standard syntax breakdown:
```c
ReturnType (*pointerName)(ArgumentType1, ArgumentType2);
```

### A Simple Example

Let's look at a basic usage without the complexity of `qsort`.

So lets declare a function pointer for using operations.
```c
int (*op)(int, int);
```
So the function pointer that is named `op`, returns `int` and takes two `int` parameters.

We can use it like so:
```c
int (*op)(int, int);

op = add;
printf("Add: %d\n", op(10, 5)); // Error

op = subtract;
printf("Subtract: %d\n", op(10, 5)); 
```
Why does it error? Well its doesnt know what add is, we do still need to point the pointer to an actual function.

We shall declare two functions `add` and `subract`:
```c
int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }
```
and use them like so:
```c
int (*op)(int, int);

op = add;
printf("Add: %d\n", op(10, 5)); // Prints 15

op = subtract;
printf("Subtract: %d\n", op(10, 5)); // Prints 5
```

While functional, typing `int (*op)(int, int)` every time you need a callback is tedious and error-prone. This is where devs turn to `typedef` or macros to make life easier.

## The Java Perspective: `Function<T, R>`

In higher-level languages like Java, this concept is abstracted into **Functional Interfaces**. Since Java 8, we rarely think about "pointers" to functions; instead, we think about Interfaces that define a single abstract method.

Java provides a standard library of these in `java.util.function`:

1. **`Function<T, R>`**: Accepts an argument of type `T` and returns a result of type `R`.

2. **`Consumer<T>`**: Accepts `T` and returns nothing `void`.

3. **`Supplier<T>`**: Takes no arguments and returns `T`.

4. **`Predicate<T>`**: Accepts `T` and returns a boolean.

In Java, passing a function looks cleaner because the types are named explicitly:

```java
// A function that takes a String and returns an Integer length
Function<String, Integer> getLength = (str) -> str.length();

// Usage
Integer len = getLength.apply("Hello World");
```

Under the hood, Java creates an instance of an anonymous class (or uses `invokedynamic`), but to the developer, it feels like passing code as a variable.

## Replicating Java Semantics in C

Can we bring that readable Java style into C? By utilizing C preprocessor macros, we can alias the complex function pointer syntax behind readable keywords.

Let's attempt to replicate the `Function`, `Consumer`, `Supplier`, and `Predicate` concepts.

### Building the Generic Foundation

First, we need a base macro that handles the raw pointer syntax. We can use variadic macros (`...` and `__VA_ARGS__`) to handle any number of arguments.

```c
// Usage: DEF_FUNCTION(int, BinaryOp, int, int);
// Result: typedef int (*BinaryOp)(int, int);
#define DEF_FUNCTION(ReturnType, TypeName, ...) \
    typedef ReturnType (*TypeName)(__VA_ARGS__)
```

Now, we can wrap that base macro to mimic Java's naming conventions.

**The `Function` Equivalent**
In C, we don't have generics `<T, R>`, but we can simulate the definition structure.

```c
// Maps directly to our base definition
#define DEF_FUNCTION_TYPE(ReturnType, TypeName, ...) \
    DEF_FUNCTION(ReturnType, TypeName, __VA_ARGS__)
```

**The `Consumer` Equivalent**
A Consumer always returns `void`. We can bake that into the macro.

```c
// Java: Consumer<T> (Takes args, returns void)
#define DEF_CONSUMER(TypeName, ...) \
    typedef void (*TypeName)(__VA_ARGS__)
```

**The `Supplier` Equivalent**
A Supplier takes `void` (no arguments) and returns a specific type.

```c
// Java: Supplier<T> (Takes void, returns T)
#define DEF_SUPPLIER(ReturnType, TypeName) \
    typedef ReturnType (*TypeName)(void)
```

**The `Predicate` Equivalent**
C doesn't have a native `boolean` type (historically), so we usually return an `int` (1 for true, 0 for false).

```c
// Java: Predicate<T> (Takes args, returns boolean/int)
#define DEF_PREDICATE(TypeName, ...) \
    typedef int (*TypeName)(__VA_ARGS__)
```

## Putting It All Together

With our macros in place (let's assume they are in `functional.h`), we can transform a standard C program into something that reads like a high-level blueprint.

First, we define our semantic types and the functions that match them. Notice how the `DEF_` macros allow us to declare the *intent* of the function pointer type immediately whether it's a Supplier, Consumer, or Predicate without getting lost in syntax.

```c
#include "functional.h"
#include <stdio.h>

// Define types using Java-style semantics
DEF_SUPPLIER(int, IntGenerator);       // Returns int, takes nothing
DEF_CONSUMER(IntPrinter, int);         // Returns void, takes int
DEF_PREDICATE(IsEven, int);            // Returns int (bool), takes int

// Implement standard C functions to match
int generateFixed() { return 42; }
void printNumber(int n) { printf("Number: %d\n", n); }
int checkEven(int n) { return n % 2 == 0; }
```

Now, look at how clean the `main` function becomes. We can instantiate these function types just like objects and pass them around. The logic flows naturally: we generate a value, check a condition, and consume the result.

```c
// Instantiate our Functional Objects
IntGenerator gen = generateFixed;
IntPrinter print = printNumber;
IsEven filter = checkEven;

// Execute
int val = gen();

if (filter(val)) {
    print(val);
}
```

### Conclusion

While C will never have the actual type safety or garbage collection of Java's functional interfaces, we can borrow their semantic clarity. By wrapping the complex spiral syntax of function pointers in macros, we make our low-level code easier to read and reason about.
