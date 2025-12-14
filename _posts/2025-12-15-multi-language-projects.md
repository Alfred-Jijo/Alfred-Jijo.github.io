# Hybrid Development: Mixing C and Python

I recently watched a breakdown of how real world projects mix compiled and interpreted languages, and it kinda opened my eyes to the fact that **Interpreters are just programs.**

When you run `python main.py`, you aren't magically summoning a "Python process." You are running a compiled C program (`python.exe` or `python` binary) that reads your text file and executes logic based on it. Because the interpreter itself is written in C, the barrier between the two languages is much thinner than it seems.

## The Two Approaches

We usually see this interplay manifest in two distinct ways. Sometimes, Python acts as the host, reaching out to C for raw speed—a technique known as **Extending**. This is the secret sauce behind libraries like NumPy and TensorFlow.

Other times, the relationship is flipped. A heavy C application invites an interpreter inside to handle logic and configuration, known as **Embedding**.

## Extending

For systems programmers, **Extending** is the most common use case. We want the ease of Python for the general application structure, but we need the raw speed of C for the heavy lifting.

Imagine we have a computationally expensive task, like a recursive calculation. If we ran this in pure Python, the overhead would pile up quickly. Instead, we can write just that specific bottleneck in standard C.

```c
// mylib.c
int heavy_computation(int n) {
    if (n <= 1) return n;
    return heavy_computation(n - 1) + heavy_computation(n - 2);
}

```

To make this accessible to Python, we can't just leave it as a source file. We need to compile it into a **Shared Library** or **Dynamically Linked List** (a `.so` file on Linux or a `.dll` on Windows). This format allows the Python interpreter to load the compiled machine code dynamically at runtime without needing to recompile the interpreter itself.

```sh
gcc -shared -o mylib.so -fPIC mylib.c

```

With the library built, the bridge is open. We don't even need complex API headers or bindings. Python's built-in `ctypes` library allows us to load that binary file and treat the C function like a native Python object.

```python
import ctypes
import time

# Load the shared library
lib = ctypes.CDLL('./mylib.so')

# Define return types (C defaults to int, but explicit is better)
lib.heavy_computation.restype = ctypes.c_int
lib.heavy_computation.argtypes = [ctypes.c_int]

print("Running heavy computation in C...")
start = time.time()
result = lib.heavy_computation(35)
end = time.time()

print(f"Result: {result}")
print(f"Time taken: {end - start:.4f} seconds")

```

By offloading just this one function, we keep the codebase readable it is still mostly Python but we get C level performance exactly where it matters.

## Embedding

The reverse dynamic is just as powerful. Consider the architecture of a game engine or a text editor like **Neovim**. These are high-performance systems written in C or C++, but they need to be flexible. You don't want to recompile the entire engine just to change the jump height of a character or the color of a UI element.

By **embedding** an interpreter (like Lua in Neovim or GDScript in Godot) inside the C program, the engine can expose its internal variables to the script. The script modifies `player_x` or `theme_color`, and the C engine simply renders the result. The engine handles the performance; the script handles the logic.
