# The Less Known Tricks of XOR

There is one property of the Exclusive OR operation that makes it infinitely more interesting than its bitwise siblings AND and OR.

```c
a ^ b ^ b == a
```

It is usually written as `b ^ b = 0`, but I find the full equation easier to reason about. It shows intent. It shows that `b` cancels itself out. If you apply the same value twice, you get the original value back. This simple reversibility is the foundation for several clever programming tricks.

## The Duplicate Problem
A common interview question asks you to find a duplicate number in an array containing values from `1` to `N`. The naive approach involves hash maps (O(N) space) or sorting (O(N log N) time).

However, if we look at the problem through the lens of XOR, the solution becomes trivial and highly efficient. The trick relies on the fact that `x ^ x` is always `0`.

If we XOR all the numbers from `1` to `N` that *should* be there, and then XOR all the numbers that are *actually* in the array, everything cancels out except the duplicate.

```c
int x = 0;

// Step 1: Accumulate the expected sequence 1..N
for (int i = 1; i <= 100; ++i) {
    x ^= i; 
    // State of x: 1 ^ 2 ^ 3 ^ ... ^ 100
}
```

Now `x` holds the "perfect" state. We then introduce the actual array data into this mix.

```c
// Step 2: XOR against the actual array elements
for (int i = 0; i < n; ++i) {
    x ^= xs[i];
    // If array is [1, 2, 3, 2] (duplicate is 2)
    // x becomes: (1^2^3) ^ (1^2^3^2)
    // The 1s cancel. The 3s cancel. The pairs cancel.
    // The only thing left is the extra 2.
}
```

The `x` variable effectively holds the history of every number we've seen. When we see a number for the second time, it wipes its previous occurrence from `x`. In the end, only the unique number remains.

## Symmetric Encryption
This same self-canceling property is why XOR is the backbone of symmetric encryption. If you take a message and XOR it with a secret key, you get a scrambled ciphertext.

```python
def encrypt(m, k):
    return ''.join([chr(ord(a) ^ k) for a in m])
```

To get the original message back, you just perform the exact same operation. You XOR the ciphertext with the key. The key cancels itself out (`k ^ k == 0`), leaving you with the original plaintext. If you use the wrong key, you get garbage.

```python
>>> msg = "Hello World"
>>> key = 123
>>> encrypted = encrypt(msg, key)
>>> encrypted
'3NMKN\x1bLNSGK'

>>> # Trying with the wrong key (69)
>>> encrypt(encrypted, 69)
'Vuhhq;iuhlg'

>>> # Trying with the correct key (123)
>>> encrypt(encrypted, 123)
'Hello World'
```

While this simple implementation isn't production-secure due to frequency analysis (if you use the same key byte for every character, patterns emerge), it illustrates the core mechanic of stream ciphers like RC4, where a pseudo-random stream of key bytes is XORed against the data.

## Swapping Without Storage
In modern languages like Python or Go, swapping variables is built into the syntax.

```python
# Python
a, b = b, a
```

```go
// Go
a, b = b, a
```

In C, however, we don't have tuple assignment. A beginner might try to swap `a` and `b` by creating two new backups:

```c
int x = b;
int y = a;
a = x;
b = y;
```

The standard optimization you may be able to quckly think of is that you only need to save one variable's state to overwrite it safely:

```c
int temp = a; 
a = b; 
b = temp;
```

But what if we are constrained on memory, or simply want to show off? We can use XOR to swap two integers in place without a single byte of extra storage.

```c
int a = 69;
int b = 420;

a ^= b; 
b ^= a; 
a ^= b; 
```

It looks like magic, but the logic holds up if you trace the bits:

1. `a` becomes a mix of both (`a ^ b`).
2. `b` becomes the original `a` by canceling out `b` from the mix.
3. `a` becomes the original `b` by canceling out `a` from the mix.

## The XOR Linked List
Standard doubly linked lists are heavy. Each node requires two pointers: `next` and `prev`. On a 64-bit system, that is 16 bytes of overhead per node just for navigation.

We can cut this overhead in half by storing a single field: the XOR difference between the previous and next address.

```c
typedef struct {
    int value;
    uintptr_t prev_and_next; // prev ^ next
} Node;
```

This single `prev_and_next` field holds the information for both directions, but we can't read it directly. We need context. We cannot randomly access a node in the middle; we must traverse from the start (where `prev` is NULL) or the end.

When appending a node, we calculate its `prev_and_next` value using the current end of the list.

```c
Node *node = node_create(value);
// New node's xored is (current_end ^ NULL) -> current_end
node->prev_and_next     = (uintptr_t)ll->end;

// Update old end's xored:
// old_xored was (prev ^ NULL). New xored needs to be (prev ^ new_node).
// Since xored ^ NULL = xored, we just XOR the new node address into it.
ll->end->prev_and_next ^= (uintptr_t)node;
```

Traversing is where the real trade-off happens. We trade CPU cycles for memory efficiency. By keeping track of our `prev` pointer during the loop, we can unlock the next node.

```c
Node *node_next(Node *node, uintptr_t *prev){
    // Next = prev_and_next ^ prev
    Node *next = (Node*)(node->prev_and_next ^ (*prev));
    
    // Update prev for the next iteration
    *prev = (uintptr_t)node;
    return next;
}
```

One fascinating side effect of this structure is that the traversal logic is identical for both directions. Because the link is symmetric (`A ^ B` is the same as `B ^ A`), the direction depends entirely on where you start.

* Start at **Head**: `1 -> 2 -> 3` (Normal order)
* Start at **Tail**: `3 -> 2 -> 1` (Reverse order)

You don't need a separate `prev` pointer or a different function to go backwards; you just feed the end node into the exact same iteration loop.

## Why You Don't See This Anymore
This is a classic systems programming optimization: complicate the code logic slightly to save significant memory at scale. However, you will rarely see this (or the variable swap trick) in a modern codebase.

There are a few reasons for this:

1. **Compilers are Smart:** Modern compilers (GCC, Clang) recognize standard patterns like `int temp = a; a = b; b = temp;` and optimize them into efficient assembly instructions (often a single `XCHG` instruction). Trying to be clever with XOR can sometimes confuse the compiler's optimizer, leading to worse performance due to instruction dependencies (pipeline stalls).
2. **Readability:** Code is read 100x more often than it is written. Debugging a segmentation fault in an XOR linked list is a nightmare compared to a standard pointer traversal because tools like `gdb` cannot automatically follow the list.
3. **The Hardware Shift:** These tricks originated in an era where RAM was expensive and CPUs were simple. Today, even though AI is hogging everything, right now we have abundant RAM, but we are bottlenecked by CPU cache misses and branch prediction. Obscuring pointers behind XOR operations can sometimes hinder the CPU's prefetcher, potentially killing any performance gains you made by saving memory.

These tricks remain powerful tools for embedded systems or extreme-scale environments (like the Linux Kernel), but for general application development, clarity almost always beats cleverness.
