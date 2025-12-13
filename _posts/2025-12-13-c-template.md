# Speeding up my C projects

I recently built ccDB, a basic C project template designed to provide a clean and organized starting point for C development. I designed it specifically to be strictly C99 compliant but with modern Quality of Life headers included in the `base/` directory.

You can find the repository here: [ccdb](https://codeberg.org/Alfred-Jijo/ccdb)

## Future Plans

The goal is to create a robust standard library for my personal projects. Here is what I am planning to include:

- [x] **Logging**
- [ ] **Allocators**
- [ ] **Basic Data Structures and Algorithms**

## Directory Structure

I wanted a structure that separates build artifacts from source code while keeping external libraries manageable.
```
.
├── src/            # source dir
├── base/           # base headers (my custom stdlib)
├── include/        # external includes
├── lib/            # external libs
├── docs/           # project docs
├── build/          # all build artifacts output
├── README.md       # Project info
└── LICENSE         # License file
```

## Why C? (And why a template?)

C is an incredibly powerful, I mean its still one of the most popular languages being used and its 53 years old. However as much I enjoy C, compared to modern systems languages like Rust, Zig, or Go, C lacks a "batteries included" standard library.

In modern languages, you get dynamic arrays, hashmaps, and distinct build tools out of the box. In C, you often find yourself reinventing the wheel, rewriting the same linked list or logging implementation for every single new project.

That is why I'm making ccDB. The `base/` folder serves as a modern "standard library" patch, adding those missing quality of life features (like logging andallocators) so I can focus on building the actual system rather than boilerplating utilities.

## Building C Projects

Building C projects is just painful. You usually have two or three stages of making build scripts. i.e CMake -> Makefile -> Finally Running.

To solve this, I am avoiding Makefiles and CMake entirely. Instead, I'm using [mate.h](https://github.com/TomasBorquez/mate.h).

mate.h allows the build system to be written in C itself. This means:

1. No context switching: I write the build logic in the same language as the project.

2. Self-contained: The build system bootstraps itself. You compile mate.c once, and it handles the complex multi-stage process of compiling sources, linking libraries, and generating the final executable in build/.

It streamlines the workflow significantly, making the "Edit -> Compile -> Run" loop feel much closer to modern tooling.
