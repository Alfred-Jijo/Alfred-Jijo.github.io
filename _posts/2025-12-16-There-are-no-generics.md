# There are no Generics in C

`_Generic` is not a generic in C
**It is manual name mangling + function overloading.**

C is not a perfect language. One of the things that I often end up wanting to use is something akin to Generics (from Rust/Java) or Templates (from C++).

"Generics" typically implies a mechanism for **code generation** a blueprint that allows the compiler to make new functions for new types automatically. C's `_Generic` does no such thing. It generates nothing; it merely points to code you have already manually written.

## Example

Let's look at a simple problem. I want a function `foo` that prints a value. I want to pass it an `int`, or a `float`, or a string.

In C, because we lack function overloading, we have to do this:
```c
void foo_int   (int i)            { printf("Int:    %d\n",  i);  }
void foo_float (float f)          { printf("Float:  %f\n",  f);  }
void foo_cstr  (const char *s)  { printf("String: %s\n",  s);  }

int main() {
    foo_int(69);
    foo_float(420.0f);
    foo_cstr("Hellow, World!\n");
}
```
This is annoying. We have to remember the specific function name for every data type.

## The C11 Solution

C11 introduced the `_Generic` macro, it allows us to write a macro that essentially acts as a compile time switch statement based on the type of the argument.
```c
#define foo(x) _Generic((x), \
    int   : foo_int,         \
    float : foo_float        \
    char *: foo_cstr         \
)(x)

int main() {
    foo(69);                // Expands to foo_int(69)
    foo(420.0f);            // Expands to foo_float(420.0f)
    foo("Hello, World!\n"); // Expands to foo_cstr("Hello, World!")
}
```
This *looks* like function overloading. You call `foo` with different types, and it works. But let's look closer at what is actually happening.

## Manual Name Mangling
In C++, you can just write `void foo(int x)` and `void foo(float x)`. The compiler handles the rest.
Under the hood, the C++ compiler performs **Name Mangling**. \
It renames your functions to something like `_Z3fooi` (for int) and `_Z3foof` (for float) inside the object file so the linker can tell them apart.

In C, `_Generic` forces **you** to do the name mangling manually.

In C++, the compiler generates specific function variants for you via Templates or handles the unique naming required for Overloading automatically. In C, however, `_Generic` forces you to do this legwork. You must write `foo_int` and `foo_float` yourself, and then you must manually write the dispatch logic to route the calls correctly.

If you decide to add support for a new type, say a `double`, the workload increases linearly. You first have to implement a dedicated `foo_double` function. Then, you must return to your `_Generic` macro and manually insert a new case mapping the `double` type to that specific function.

## Generics vs. Dispatching
True Generics (like in Rust) or Templates (like in C++) are about **Code Generation**.
When you write `fn foo<T>(x: T)`, the compiler generates a unique version of that function for every `T` you use.

`_Generic` in C is about **Dispatching**.
It doesn't generate code. It doesn't write functions for you. It just looks at a type list and points to a function you already wrote.

It is a useful feature. It powers `tgmath.h` (Type-Generic Math), which allows you to call `sin(x)` without worrying if `x` is a float or a double but it is: **Type-Safe Macro Dispatching**, not Generics.
