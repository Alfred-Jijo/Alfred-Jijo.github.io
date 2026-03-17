# The C Replacement Myth

I have been writing C long enough to have strong opinions about it. Not the kind of opinions you form from reading blog posts - the kind you form at 1am debugging a segfault that turns out to be a strlen reading six bytes past the end of a buffer that was never null terminated in the first place.

I also maintain a project called cbase. It is a zero-dependency foundation framework I built from scratch to give myself the quality of life features C refuses to provide - string slices, virtual memory arenas, a generic allocator interface, exact-width types. I use it as a template for every new C project I start. Building it is how I developed real opinions about why C alternatives exist, what they actually fix, and why none of them are going to kill C anytime soon.

---

## Why People Keep Trying

C is fifty years old. It emerged in the early 1970s, inheriting foundational concepts like lexical scoping from Algol, and then conquered every piece of hardware that followed. The standard has been revised continuously - the latest release dropped in 2024 - but the roots from 1974 are still buried deep in the language architecture.

That age carries real weight. Null terminated strings, a macro system that does blind text substitution, array decay where the compiler silently forgets the length of an array the moment you pass it to a function, and enough undefined behaviour to fill a textbook. The language also carries the burden of supporting obscure legacy architectures that no sane developer is actively targeting.

Modern developers look at this and assume it must be replaceable. And they are not wrong that the pain points are real. But replacing C is not the same as writing a better compiler.

---

## The Problem I Hit Building cbase

Before talking about alternatives, let me show you the problem concretely.

When you write C seriously, the standard library almost immediately becomes your enemy. The string API is built on the assumption that every string is a null terminated char array. This means you cannot take a substring without either allocating a new buffer, or temporarily mutating the original string by writing a null byte somewhere in the middle. Every strlen call is O(n) because the length is never stored anywhere. Every function that takes a string silently trusts that you calculated the length correctly.

So the first thing cbase ships is String8 - a sized UTF-8 string slice. Just a pointer and a length bundled together:

```c
typedef struct {
    u8    *ptr;
    usize  len;
} String8;
```

With this, taking a substring is zero allocation. You just construct a new slice pointing into the middle of the existing memory with a shorter length:

```c
String8 path = STR8("src/main.c");
String8 dir  = str8_prefix(path, 3);  // "src"    - no malloc
String8 file = str8_skip(path, 4);    // "main.c" - no malloc
String8 ext  = str8_suffix(path, 2);  // ".c"     - no malloc
```

None of these allocate. They all just create a new view into the original memory. In standard C you would need three separate heap allocations and three strcpy calls to do the same thing.

This is the specific class of problem that C alternatives are trying to fix. Not the syntax. Not the performance model. The gap between what the language gives you and what you actually need to write clean code.

---

## The Three Reasons C Cannot Be Killed

Even if you build a perfect language, there are structural reasons it will not replace C.

**C is the lowest level cross-platform language we have.** If you want more direct control over the hardware than C gives you, your only option is to drop into assembly. Assembly does not port between CPU architectures. C sits exactly at the boundary between human readable logic and raw machine instructions, and nothing else occupies that position across every architecture that exists.

**C is literally everywhere.** If a piece of silicon has a processor in it, someone has written a C compiler for it. Supercomputers, embedded microcontrollers, the chip in your microwave. The toolchain coverage is total in a way no other language can claim.

**C is the lingua franca.** Every programming language ever created that wanted to talk to an operating system had to learn to speak C, because operating system APIs are written in C. Python, Go, Java, Kotlin - they all have a Foreign Function Interface built specifically to call C code. If you want to write a library that any language can use, you write it with a C API.

This creates a deadlock. Every new language still has to support C's memory layouts, C's calling conventions, C's string representation - even though everyone agrees these things are bad - because the entire software world is built on top of them. You cannot replace the foundation without also replacing everything standing on it.

There is also a scope problem. C is an "everything language" - it runs on 8-bit microcontrollers and 64-bit server farms equally. Most modern alternatives deliberately choose a narrower scope because that is what makes them genuinely better. But that narrow scope also makes total replacement structurally impossible. Different people have different problems with C. It is the common denominator of all programming paradigms and that is both its greatest strength and the reason it will outlive most of the languages trying to replace it.

---

## What the Alternatives Actually Fix

Every serious C alternative ships a small set of improvements targeting the same universal pain points.

**Slices** are the most immediate change. In C, passing an array to a function means passing a pointer and a separate length integer. A slice bundles these together natively. The String8 type in cbase is exactly this pattern implemented manually - a slice for characters. Most C developers end up building this themselves anyway. The alternatives just make it a first class language feature.

**Allocators** are the next big one. Standard C gives you one global malloc. Modern languages provide standard ways to pass allocators around as function parameters, so library code stays allocator-agnostic. You swap between an arena, a heap allocator, or a pool at the call site without touching the internals. cbase ships an Allocator vtable for exactly this reason - but building it in raw C requires a lot of boilerplate that the alternatives handle natively.

**Proper generics** remove the need for void pointer casting and macro hacks. C technically has generics in the sense that you can sort of emulate them with macros. But it really does not work that well. Real generics handle this at the language level without the hidden bugs that come with text substitution.

**Compile time execution** is where things get genuinely interesting, especially in Zig. The C preprocessor can do a limited version of this but it is so restricted and painful that most developers avoid it entirely.

---

## What cbase Taught Me About Allocators

The thing that took the most time to get right in cbase was the arena allocator - and building it taught me more about why C is the way it is than anything else.

The standard approach to memory in C is malloc and free. Every allocation is a separate call to the OS allocator, which has to maintain bookkeeping data, find a suitable block, potentially request more memory from the OS, and eventually coalesce fragments when things get freed. Under heavy load this becomes expensive and fragmentation becomes a real problem.

An arena takes a completely different approach. You ask the OS for one large contiguous block of virtual address space upfront - say, one gigabyte - and then hand out slices of it linearly with pointer arithmetic. There is no free. When you are done with the whole arena you release it all at once.

The interesting engineering problem is the gap between virtual address space and physical RAM. When cbase does this:

```c
Arena arena = arena_create(GB(1));
```

That call reserves one gigabyte of virtual address space using VirtualAlloc on Windows or mmap on POSIX. The key word is reserve. No physical RAM is committed yet. The address range is claimed but the memory does not actually exist in physical form.

As allocations happen and the offset pointer advances, the arena automatically calculates when a new 64KB chunk of physical RAM needs to be committed and requests it from the OS. The application never thinks about this - it just calls PUSH_STRUCT or PUSH_ARRAY and gets back a zero-initialised pointer.

```c
MyStruct *s   = PUSH_STRUCT(&arena, MyStruct);
u32      *buf = PUSH_ARRAY(&arena, u32, 1024);
```

You can also take scoped temporary allocations that automatically roll back:

```c
ArenaTemp tmp     = arena_temp_begin(&arena);
u8        *scratch = PUSH_ARRAY(&arena, u8, 512);
arena_temp_end(tmp);  // scratch is gone, permanent allocations survive
```

Building this entirely from scratch in C, without calling malloc once, forced me to understand virtual memory at a level I could not have gotten from reading about it. This is also the thing most C developers have built their own version of at some point - and the reason migrating away from C is hard. You are not just leaving a language. You are abandoning your own custom standard library that you spent years perfecting.

---

## The Three Contenders

I have written real code in all three. Here is what I actually think.

**Zig** is the most technically exciting option and my personal recommendation for new projects where you have full control over the stack.

The killer feature is that the Zig compiler is a fully functional C compiler. You can drop Zig into an existing C codebase and translate it file by file without breaking your build process. That alone makes it worth serious consideration for anyone maintaining legacy C.

The comptime system is genuinely impressive. You can write generic data structures parameterised on types at compile time with zero runtime overhead, and the implementation reads cleanly rather than being a maze of macros. Building the equivalent of cbase's generic Allocator vtable in Zig would be half the code and twice as readable.

Zig is also arguably lower level than C in some respects - you get extremely granular control over memory layout, alignment, and compile time behaviour that C simply cannot express.

The tradeoff is that Zig diverges heavily from C idioms. If you are a veteran C developer, the mental model feels foreign, especially around error handling. It also focuses primarily on embedded systems and extreme performance use cases, and emitting a clean C API from a Zig project feels slightly awkward because Zig wants you to do things the Zig way. These are real friction points. But the comptime system alone is worth the learning curve if you are starting fresh.

**Odin** is the one I recommend to C developers who want to feel at home immediately. A lot of standard C architecture ports to Odin almost line for line. The data structures look familiar, the memory model is recognisable, and the language adds exactly the quality of life features you want - slices, explicit allocators as function parameters, proper multiple return values, a sane string type - without forcing a paradigm shift.

The type syntax is the biggest visual difference. Odin forces left to right reading: name first, then type. In C, complex types involving function pointers spiral in multiple directions and require the clockwise-spiral rule to parse. Odin fixes this completely.

It is not trying to squeeze the last cycle out of embedded hardware. It operates at a slightly higher level than C and does not particularly care about being a universal FFI target. It just wants to be a good, fast tool for software engineers building real applications. If you want to change your workflow as little as possible while genuinely escaping C's worst pain points, Odin is probably where you start.

**C3** has one very specific and aggressive goal: feel exactly like C. More so than any other alternative on the market. It targets perfect two-way interoperability with existing C code and makes almost no changes to the underlying mental model.

You can write a function in C3, attach an export attribute, and your existing C application calls it natively without any interop layer. The application does not know it is not talking to C. That is a genuinely impressive engineering achievement and it makes C3 the least painful migration path for anyone with a large existing C codebase.

The tradeoff is that to achieve this level of compatibility C3 has to stay very close to the metal and retain a lot of C's specific flavour. It diverges the least of the three. The macro system is significantly improved - proper hygienic macros rather than text substitution - but the overall experience is incremental improvement rather than a rethinking of the model. If you want a total paradigm shift, look elsewhere. If you want friction-free integration with your existing code, C3 is currently unmatched.

---

## Why We Are Not Talking About Rust

Rust is not a C alternative. It is a C++ alternative.

The problems Rust solves - memory ownership, borrow checking, lifetimes, algebraic data types, trait-based generics - are the exact problems modern C++ has been awkwardly trying to bolt on for fifteen years. If you want those features built directly into the type system, Rust is the clear winner of that race. Trying to shove those concepts into C++ after the fact is how you wind up with the nightmare that is modern C++ syntax.

But Rust is solving a massive architectural complexity problem. Developers looking for a C alternative are usually not asking for that. They want a simple, composable language that gets out of their way, gives them direct memory control, and does not require a PhD in type theory to write a linked list. That is exactly what Zig, Odin, and C3 are offering and exactly what Rust is not.

---

## The Reality

C is not going to become the next COBOL. People are not maintaining it out of corporate inertia and collective dread. People genuinely like the C programming model. It maps cleanly to how computers actually work. It compiles fast because it is simple. It runs on everything. And the FFI situation means it will always be needed as a common interface layer even if new code stops being written in it directly.

The comment that inspired my video on this topic put it well - C is easy to learn and work with, and it is probably always going to be running on some machine somewhere, if not all of them.

The alternatives are genuinely better environments for new systems code. I built cbase entirely in C because I wanted to understand the foundations from scratch - the virtual memory model, the alignment math, the allocator patterns. That was worth doing. But for a production project where you are not bootstrapping your own primitives, Zig in particular is worth serious consideration.

The lingua franca endures. But the trenches do not have to stay in 1974.

---

*cbase source:		  https://gitlab.com/Alfred-Jijo/ccdb*
*cbase documentation: https://alfred-jijo.github.io/docs/cbase/*
