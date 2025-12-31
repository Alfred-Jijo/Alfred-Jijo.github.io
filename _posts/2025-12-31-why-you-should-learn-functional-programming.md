# Why a Systems Programmer Should Care About Functional Programming

Let’s get one thing clear before I start: I am not a "Functional Programming Evangelist." I don’t think Monads are the solution to world peace, and I honestly believe that if you can’t explain how your code maps to memory, you probably shouldn’t be writing it.

I spend my days in the labs on Byrom Street staring at `gdb` output, writing C allocators, and arguing about why `sed` is superior to `awk`. My idea of a good time is optimising a window manager’s render loop or shaving milliseconds off a context switch.

So, when I was first forced to look at Functional Programming (FP), my reaction was roughly: *"Why would I want to write C code, but slower, with weird syntax, and without the ability to mutate variables?"*

It felt like an academic toy. A way for theorists to feel superior while we did the actual work of keeping the kernel running.

But recently, I read a post by Daniel Beskin titled [*"What's the Point of Learning Functional Programming?"*](https://blog.daniel-beskin.com/posts). It centres on a specific problem the **Knight’s Tour** and a concept called **Wholemeal Programming**.

It didn't convince me to switch to Haskell. But it *did* convince me that I’ve been writing C wrong for three years.

Here is why a systems programmer should actually give a damn about this stuff.

## The Trap

The reason most of us (specifically, those of us who live in `vim` and dream in assembly) bounce off FP is that we are taught it wrong. Or rather, we try to learn it by translating our C logic directly.

Beskin mentions a "Student's Complaint" that perfectly captures my initial frustration:

> *"If we just take a standard loop and turn it into a tail-recursive function, are we actually learning anything new? It’s just the same logic with a different coat of paint."*

He’s right. Let’s look at the **Knight’s Tour** problem. You have a chess board; you need to move a knight so it visits every square exactly once.

### The Imperative Brain

In C, my brain immediately goes to a backtracking algorithm with a mutable 2D array.

```c
// The "Standard" C Approach
int board[8][8]; // 0 = empty, 1..64 = move number

int solve_tour(int x, int y, int move_count) {
    board[x][y] = move_count;
    
    if (move_count == 64) return 1; // Success!

    // Try all 8 moves
    for (int i = 0; i < 8; i++) {
        int nx = x + moves[i][0];
        int ny = y + moves[i][1];
        
        if (is_valid(nx, ny) && board[nx][ny] == 0) {
            if (solve_tour(nx, ny, move_count + 1)) return 1;
        }
    }

    // Backtrack: Undo the damage
    board[x][y] = 0; 
    return 0;
}
```

This is fast. It hits the cache nicely. It’s also **fragile**. The state (`board`) is global (or passed by pointer) and mutated in place. If I screw up the backtracking step (`board[x][y] = 0`), the state is corrupted forever.

### The Naive Functional Translation

When systems students try to write this in a functional language (or a functional style in C++), we usually just thread the state through the recursion.

Instead of a global `board`, we pass a `const Board` state into the function, and the function returns a *new* Board with the move applied.

Beskin points out that if you do this mechanically, you end up with code that is logically identical to the C loop, just significantly slower because you’re copying data structures around. It’s tedious. You’re doing imperative logic, but fighting the language to do it.

If this is all FP is, it’s useless to us.

## The Shift

The turning point in Beskin’s article and the moment the penny dropped for me is the introduction of **Wholemeal Programming**.

The term comes from Ralf Hinze (and Geraint Jones), but let's translate it into Systems Speak.

In the imperative C example above, we are thinking **move by move**. We are obsessing over the *process* of finding the solution.

1. Move here.
2. Check valid.
3. Recurse.
4. Backtrack.

**Wholemeal Programming** suggests we stop thinking about the *steps* and start thinking about the **search space**.

Instead of writing a function that "finds the next move", you write a definition that describes "the tree of all possible legal games".

Wait. I know what you're thinking. *"Build the whole tree? For a Knight's Tour? That will blow out the heap in 0.02 seconds."*

This is where the concept of **Laziness** comes in. And this is where systems programmers should sit up and pay attention.

### Laziness is just a Dependency Graph

In Haskell, "Lazy Evaluation" means values aren't computed until they are needed. High-level devs think of this as magic.

We know better. We use this concept every day.

* **Makefiles:** When you run `make`, it doesn't compile every file. It builds a Directed Acyclic Graph (DAG) of dependencies. It only executes the "build" command for the nodes that are actually required by the target.
* **Virtual Memory:** The OS doesn't allocate physical RAM when you `malloc(4GB)`. It hands you a virtual address range. It only maps physical pages when you actually *touch* the memory (page fault).
* **Copy-on-Write (COW):** `fork()` is cheap because we don't copy the parent's memory. We just point to it and say "copy this later if someone writes to it."

In FP, treating the Knight’s Tour "Wholemeal" means defining a data structure that *represents* the tree of all moves, but the runtime only "builds" the path we are currently looking at.

Why does this matter for C?

Because it forces you to separate **Generation** from **Search**.

## State Space vs. Spaghetti Logic

In my C code above, look at how mixed up everything is.
The `solve_tour` function handles:

1. **Boundary checking** (`is_valid`)
2. **State mutation** (`board[x][y] = val`)
3. **Search logic** (the `for` loop)
4. **Termination logic** (`if move_count == 64`)

If I wanted to change the search algorithm (e.g., from Depth-First Search to Warnsdorff’s Rule heuristic), I have to rewrite the core loop. I risk breaking the boundary checks just to make the search faster.

Beskin argues for reifying the state making it a concrete object.

### The Functional "Systems" Approach

If I apply "Wholemeal" thinking to C++, I stop writing a loop. I write a **Generator**.

```cpp
// Modern C++ "Functional" Style (Concepts)

struct TourState {
    std::array<std::array<int, 8>, 8> board;
    int current_x, current_y;
    int depth;
};

// Pure function: Returns a list (or lazy range) of valid next states
auto next_moves(const TourState& s) {
    return all_knight_moves(s.current_x, s.current_y) 
           | std::views::filter([&](auto pos) { return is_valid(s.board, pos); })
           | std::views::transform([&](auto pos) { return apply_move(s, pos); });
}
```

This is the systems equivalent of the "Wholemeal" concept.

1. **Immutability:** `apply_move` doesn't trash the previous board; it returns a new state. (Yes, copying 64 ints is cheap; don't premature-optimise).
2. **Separation:** `next_moves` knows *nothing* about how we are searching. It just generates the "dependency graph" of states.

Now, the "Solver" is just a generic algorithm that consumes this graph.

```cpp
// The search logic is now separate from the game logic
auto solution = search_tree(initial_state, next_moves, is_complete);
```

## Modularity: The Unix Philosophy

This separation connects directly to something we value deeply: **The Unix Philosophy**.

* *Write programs that do one thing and do it well.*
* *Write programs to work together.*
* *Write programs to handle text streams, because that is a universal interface.*

In the imperative C version, the "generation of moves" and the "consumption of moves" are tightly coupled inside that `for` loop. You cannot pipe the output of `solve_tour` into another tool.

In the Wholemeal/Functional version, `next_moves` generates a stream.

* We can pipe that stream into a heuristic filter (Warnsdorff’s rule).
* We can pipe it into a concurrency handler (run branches on different threads).
* We can pipe it into a debug printer.

We haven't just written "cleaner code"; we've architected a system where the components are decoupled. We treated the *execution flow* as data.

## Making Illegal States Unrepresentable

One of Beskin’s points regarding the state object (`TourState`) resonates hard with modern systems design (especially if you've dabbled in Rust).

In the C loop, the "state" is implicit. It’s the combination of the `board` array, the loop counter `i`, the recursion depth `move_count`, and the current stack frame variables `nx, ny`.

If I interrupt that C loop halfway through, the state is ill-defined. The board might have a "partial" move applied.

In the functional approach, a `TourState` is a snapshot. It is valid or it doesn't exist. This sounds like the database concept of **Atomicity**, or the OS concept of **Atomic Transactions**.

By adopting the functional habit of "passing state explicitly" rather than "mutating the world implicitly," we eliminate entire classes of bugs related to stale state, race conditions, and undo-logic failures.

## The Payoff

I’m not suggesting we rewrite the Linux Kernel in Haskell. The Garbage Collector pauses alone would give me an aneurysm.

But the *concepts*? They are gold.

Since reading Beskin's breakdown of the Knight's Tour, I’ve changed how I write C and C++.

1. **I isolate side-effects.** I separate the functions that *calculate* data from the functions that *write* to pointers.
2. **I use "Lazy" structures.** I use C++20 `ranges` and views to build processing pipelines rather than writing raw `for` loops.
3. **I reify state.** Instead of scattering booleans across a function, I define a struct that represents the exact state of the system, and I write transitions between those structs.

The lesson isn't to stop caring about memory or performance. The lesson is that **managing state complexity is the hardest part of systems programming.**

Functional Programming provides the rigorous mathematical framework for managing that complexity. We don't have to buy the whole religion, but we should absolutely steal their best tools.

So, stop translating your C loops into Haskell. Start translating functional concepts into your C.

*Recommended reading:*

* [*"What's the Point of Learning Functional Programming?"*](https://blog.daniel-beskin.com/posts)* by Daniel Beskin*
* *Structure and Interpretation of Computer Programs (SICP)*
* *Modern C++ Design (for template metaprogramming madness)*
