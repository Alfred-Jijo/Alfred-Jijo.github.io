# Memory is Virtual: Moving Beyond Malloc

Memory management is often treated as the hardest part of C programming.

The standard approach `malloc` and `free` for every individual object leads to three major problems:

1.  **Fragmentation:** The heap becomes a swiss cheese of holes.
2.  **Performance:** `malloc` is slow and unpredictable; it searches for free slots.
3.  **Complexity:** Tracking the lifetime of every single allocated byte is a recipe for memory leaks and use-after-free bugs.

There is a better way. It is the secret weapon of game engines and high performance systems: **The Linear Arena**.

## What is an Arena?

An Arena (also called a Linear Allocator) is simple. It is a large, pre allocated block of memory with a single pointer (offset) tracking usage.

To allocate memory, you simply take the current pointer, move it forward by the size you need, and return the old pointer.

There are no individual freeing, in an Arena. If you free the Arena you also free everything inside of it.

### The "Bump" Allocator

Here is the core logic in a nutshell:

```c
void *arena_alloc(Arena *a, size_t size) {
    // Calculate pointer to the current free spot
    void *ptr = a->base + a->offset;
    
    // Bump the offset forward
    a->offset += size;
    
    // Return the pointer
    return ptr;
}
```
**Why is this better?**

* **Speed:** Allocation is essentially a few CPU instructions (addition). It is **O(1)**.
* **Cache Locality:** Related data allocated together stays together in RAM, drastically reducing CPU cache misses.
* **Instant Cleanup:** You don't `free` individual objects. You simply set `offset = 0`. This releases "millions" of objects in a single instruction. Ok maybe a bit of an hyperbole there, but there can be alot.

## The Problem with Fixed Sizes

The naive implementation of an arena uses a fixed size buffer, often allocated via `malloc` or on the stack.

```c
// A 1MB fixed arena
uint8_t buffer[1024 * 1024]; 
Arena a = arena_init(buffer, sizeof(buffer));
```
This creates a problem. What if 1MB isn't enough? What if we need 100MB? If we allocate 1GB up front using `malloc`, the OS might refuse, or we might waste massive amounts of RAM for a program that only uses 5KB, and with Todays's RAM pricing. Your going to want to optimise as much as possible.

To solve this, we need to talk directly to the OS kernel. We need to understand the difference between **Virtual Memory** and **Physical Memory**.

## Virtual vs. Physical Memory

Modern operating systems provide a feature called Virtual Memory. This provides a layer of abstraction between your program's pointers and the actual RAM sticks in your computer.

### Restaurant Analogy

Imagine a massive restaurant with 1 million tables.

1. **Reserving (Virtual Memory):** You call the maitre d' and say, "I might have a party of 10,000 people coming. Save tables #1 to #10,000 for me."
* The maitre d' marks those tables as "Reserved" on his map.
* *Crucially: No tables are actually set. No waiters are assigned. No resources are consumed yet.*
* The restaurant still looks empty.


2. **Committing (Physical Memory):** Your guests start arriving. You say, "Okay, the first 50 people are here. Set tables #1 to #50."
* Now the restaurant puts out plates (RAM) and assigns waiters.
* This is the only time actual physical resources are used.


On a 64-bit processor, the address space is functionally infinite. You can "Reserve" 4 Terabytes of virtual address space, and the OS won't bat an eye. It costs nothing but a tiny entry in a kernel table.

## Building the Virtual Arena

Instead of `malloc`, we use OS primitives to reserve a massive block (e.g., 64GB) but commit **zero** RAM initially. As we bump the arena pointer, we detect when we cross a "Page" boundary (usually 4KB) and ask the OS to commit physical RAM just for that chunk.

### The Data Structure

```c
typedef struct {
    uint8_t *base;      // Start of our reserved address space
    uint64_t capacity;  // Total reserved size (e.g., 64GB)
    uint64_t pos;       // Where the user thinks we are
    uint64_t commit_pos;// How much physical RAM we actually own
} Arena;
```
### The Smart Allocation Logic

When we push data, we check if we are about to write into uncommitted territory.

```c
void *arena_push(Arena *a, uint64_t size) {
    uint64_t new_pos = a->pos + size;

    // Do we have enough physical RAM?
    if (new_pos > a->commit_pos) {
        // Calculate how much new RAM to ask for
        uint64_t new_commit_top = AlignUp(new_pos, PAGE_SIZE);
        uint64_t bytes_to_commit = new_commit_top - a->commit_pos;
        
        // Ask the OS for RAM at specific address
        os_commit(a->base + a->commit_pos, bytes_to_commit);
        
        a->commit_pos = new_commit_top;
    }

    void *ptr = a->base + a->pos;
    a->pos = new_pos;
    return ptr;
}
```
## Talking to the Kernel: OS Primitives

To make this work, we need platform specific wrappers. `malloc` hides this from us, but for high performance, we need to peek behind the curtain.

### Windows

Windows uses `VirtualAlloc` for both reserving and committing.

```c
// Reserve Address Space (No RAM usage)
void *os_reserve(size_t size) {
    return VirtualAlloc(NULL, size, MEM_RESERVE, PAGE_READWRITE);
}

// Commit Physical RAM
bool os_commit(void *ptr, size_t size) {
    return VirtualAlloc(ptr, size, MEM_COMMIT, PAGE_READWRITE) != NULL;
}
```
### Linux / Unix

Linux uses `mmap`. To reserve, we map anonymously with `PROT_NONE` (no permissions). To commit, we change protections to `PROT_READ | PROT_WRITE`.

```c
// Reserve Address Space
void *os_reserve(size_t size) {
    // PROT_NONE means accessing this crashes the app (until committed)
    return mmap(NULL, size, PROT_NONE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
}

// Commit Physical RAM
bool os_commit(void *ptr, size_t size) {
    // mprotect tells the kernel: "We want to use this now."
    return mprotect(ptr, size, PROT_READ | PROT_WRITE) == 0;
}
```
## One Interface to Rule Them All

One problem with writing custom allocators is that your functions get coupled to them. If you write `load_texture(Arena *a)`, you can never use that function with `malloc` or a stack buffer.

We can solve this with a simple polymorphic struct (a "vtable" in C).

```c
typedef struct Allocator {
    void *(*alloc)(size_t size, void *ctx);
    void (*free)(size_t size, void *ptr, void *ctx);
    void *ctx;
} Allocator;
```
Now, `load_texture` just takes `Allocator alloc`. We can create a helper to convert our Arena into this generic interface.

```c
Allocator arena_as_allocator(Arena *a) {
    return (Allocator){ .alloc = arena_wrapper_alloc, .ctx = a };
}
```
## Syntactic Sugar

Calling `alloc.alloc(sizeof(int) * 100, alloc.ctx)` is verbose and prone to type errors. We can use C macros to make this clean and type safe.

```c
#define make(T, n, alloc) \
    ((T *)((alloc).alloc(sizeof(T) * (n), (alloc).ctx)))

// Usage
int *numbers = make(int, 100, my_allocator);
```
This casts the `void *` return automatically and calculates the size for us.

## The Downside (and the Fix)

Arenas are amazing, but they have one flaw: **You cannot free individual items.**\
If you are spawning thousands of bullets or particles that die at random times, an Arena is a bad fit. The memory for a "dead" bullet stays occupied until the *entire* arena is reset.

**The Fix:** Use a **Pool Allocator**.
A Pool splits a block of memory into equal sized chunks. It keeps a linked list of "free slots."\
When you free an item, it just adds that slot back to the list. This gives you O(1) allocation *and* O(1) individual freeing, with zero fragmentation.

## Conclusion

By stepping away from `malloc` and utilizing the virtual memory hardware provided by the CPU, we gain immense power.\
We separate address space (Reserve) from resource usage (Commit), and we stop tracking individual frees.

This is how systems programming is meant to be done. Optimising how your programs work with machines has never looked so good. Stop asking `malloc` for permission and start taking control of your memory.
