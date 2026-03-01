# Come C some shenanigans

I recently watched a video by Xander Gouws titled "The C Iceberg". It covers a lot of the weird, historical, and deeply fundamental quirks of the C programming language. It got me thinking about how much we take for granted when writing systems code, and how many of these ancient design decisions still haunt modern languages today.

Let's break down some of the most interesting behaviors discussed in the video.

### Pointers, Arrays, and Party Tricks

We all know that arrays and pointers are closely related. An array essentially acts as a pointer to its first element [00:01:02]. But they are not exactly the same thing. What actually happens is a process called array decay, which is the automatic conversion of arrays to pointers in specific contexts [00:01:52].

Because of how pointer arithmetic works under the hood, adding one to a pointer gives you the address of the next element in the sequence [00:01:09]. The compiler automatically accounts for the size of the data type. This means dereferencing `array + index` is the exact same thing as typing `array[index]` [00:01:21].

Here is where it gets stupid. Since addition is commutative, `index + array` works just as well. This leads to a bizarre but completely valid C trick. You can write `index[array]` and the compiler will accept it and it will run perfectly [00:01:41].

```c
int my_array[5] = {10, 20, 30, 40, 50};
int val = 2[my_array]; // This evaluates to 30
```

It is a neat party trick. Just do not use it in production code unless you want your coworkers to hate you.

### The Stack, The Heap, and Undefined Behavior

When a function is called, a stack frame is pushed containing all the local variables and the return address [00:02:06]. When the function returns, that frame is popped off the stack and the memory is gone [00:02:17].

A classic rookie mistake is returning a pointer to a local stack variable. Once the function finishes, that pointer is looking at garbage memory, resulting in undefined behavior [00:02:34]. If you need memory to outlive the function call, you have to use the heap via `malloc` [00:02:46]. But as we all know, if you forget to `free` that memory, you get a memory leak that will eventually crash your program [00:03:04]. This is why I prefer building custom allocators and arenas, but that is a rant for another day.

### Struct Alignment and Wasted Space

If you define a struct with a `char` (1 byte), an `int` (4 bytes), and another `char` (1 byte), you might expect it to take exactly 6 bytes of memory [00:03:24]. On most modern systems, it will actually take 12 bytes [00:03:34].

Processors are optimized to read memory in chunks, usually four or eight bytes at a time. To make this efficient, the compiler adds padding bytes so that the fields align to addresses that are multiples of their size [00:03:42].

If you rearrange the fields and group the two `char` variables together, they can sit next to each other without wasting space, shrinking the struct down to 8 bytes [00:04:05]. Field order matters immensely, especially when you are programming for an embedded system with strict memory limits or allocating millions of nodes in a game engine [00:04:10].

### The Compiler is Smarter Than You

Compilers are terrifyingly smart pieces of software. If you write a simple loop to calculate the sum of numbers from 1 to N, you have written an algorithm with O(N) time complexity [00:04:30].

But a modern compiler using a technique called scalar evolution can recognize what you are doing from first principles. It will replace your entire loop with the mathematical formula for triangular numbers, turning your code into an O(1) operation automatically [00:04:40].

This proves a vital point. You should focus on writing readable code and good algorithms. Trying to manually optimize things by writing convoluted logic can actually obfuscate the code and hurt performance because it confuses the compiler [00:04:57].

### Negative Numbers and Unsafe Relics

C allows you to operate directly on individual bits. But what happens when you do a bitwise operation on a negative number? [00:05:24]

Almost all modern hardware uses two's complement to represent negative integers [00:05:30]. However, prior to the C23 standard, two's complement was never strictly required by the C specification [00:05:43]. This meant bitwise operations on signed integers were technically implementation specific and could vary between architectures. As of C23, two's complement is finally required and these operations are well defined [00:05:52].

Speaking of standards, the C standard library is still full of ancient functions that are fundamentally unsafe. The `strcpy` function will happily copy a string into a buffer without checking if it actually fits, causing massive security vulnerabilities through buffer overflows [00:05:59]. Another offender is `atoi`, which converts strings to integers but has literally no way to report parsing errors, failing completely silently [00:06:16].

### Digraphs, Trigraphs, and Ancient Keyboards

Back in the early days of computing, not all keyboards had keys for characters like curly brackets. To fix this, the C standard introduced digraphs and trigraphs as alternative ways to type these symbols [00:06:28].

You can use `<%` and `%>` instead of curly brackets, and it is completely valid C code [00:06:42]. Trigraphs are even uglier, using three character sequences starting with two question marks [00:06:55]. Most modern compilers will throw a warning if you try to use trigraphs by default today, but it is hilarious that the language had to adapt to physical hardware limitations of the 1970s.

### The True Entry Point

We are all taught that `main` is the true start of a C program. It isn't [00:07:05].

Before your `main` function ever runs, a function usually called `_start` executes to handle a bunch of critical setup work. It initializes the C standard library, prepares the command line arguments, and sets up the execution environment [00:07:16].

If you are working in an embedded environment or writing a minimal operating system, you can customize this `_start` function to skip the standard library entirely and take complete control over the initialization sequence [00:07:28].

### A Byte is Not Always 8 Bits

This sounds pedantic but it is entirely true. We assume a `char` is one byte, and we assume a byte is exactly eight bits [00:07:44].

The C standard guarantees that a `char` is exactly one byte, but it never actually defines how many bits are in a byte [00:07:51]. Because it is never directly defined, it is technically implementation specific. On certain embedded systems or digital signal processors, a byte can be 16, 24, or even 32 bits [00:08:04]. The hardware dictates the word size, not the language.

### The Octal Trap

If you have ever seen a meme mocking JavaScript for evaluating `010 == 8` as true, you can actually blame C for that behavior [00:08:18].

Often in low level programming, you want to define numbers in specific base representations. In C, prefixing a number literal with `0x` means it is hexadecimal [00:08:40]. But for whatever reason, the original designers decided that the literal prefix for an octal number (base 8) should be just a single `0` [00:08:54].

So when you type `010`, the compiler interprets that as 10 in base 8, which is mathematically equal to 8 [00:09:00]. JavaScript simply inherited this exact same literal prefix logic from C, causing endless confusion for web developers decades later [00:09:06].

These quirks are exactly why I love systems programming. The language doesn't hide the history or the hardware from you. It gives you the raw tools, the sharp edges, and expects you to know what you are doing.