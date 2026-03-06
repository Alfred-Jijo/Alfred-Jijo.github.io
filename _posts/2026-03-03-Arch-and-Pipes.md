---
layout: post
title: "Building a Windows Terminal: Architecture & Anonymous Pipes"
series: "WinTer"
series_part: 2
---

## Architecture & Laying the Plumbing

Before Windows 10 version 1809, building a terminal emulator on Windows was a nightmare. If you wanted to host `cmd.exe` or PowerShell inside your own custom window, there was no clean API for it. The standard approach was to spin up a hidden console window off-screen, then use `ReadConsoleOutput` to scrape the contents of that hidden buffer and redraw them in your own UI. This is how old terminal emulators like ConEmu and ConsoleZ worked for years.

This approach was brittle, slow, and deeply unpleasant. It could not handle full-screen terminal applications like `vim` or `htop` correctly. It had race conditions. It was a hack on top of a hack.

Unix and Linux have always had a cleaner model for this. The POSIX PTY (Pseudo Terminal) API lets you create a virtual terminal device that behaves exactly like a real hardware serial terminal, but exists entirely in software. You get a master side and a slave side. Your application holds the master, the shell gets the slave, and data flows cleanly between them.

In 2018, Microsoft finally shipped the **ConPTY (Windows Pseudo Console)** API, which brings a similar model to Windows. It is the foundation of the modern Windows Terminal, and it is what we are going to use.

But before we write any code, let's understand the full picture of what we are building.

### Terminal Architecture

A terminal emulator is a middleman. On one side is the shell a text-mode program that reads input and writes output as a stream of bytes. On the other side is you a human who wants to see those bytes rendered as legible text on a GPU-accelerated window with nice fonts and colors.

Bridging those two things cleanly requires several distinct layers of work. We can split the architecture of WinTer into three main layers:

1. **The OS Interface (Plumbing):** Spawning the shell process, attaching it to ConPTY, and managing the memory pipes that stream raw byte data back and forth. This is what we are building now.
2. **The State & Parser (Brain):** The raw byte stream coming from the shell is not just printable text. It is full of invisible ANSI escape sequences special byte patterns that mean things like "move the cursor up two lines", "set the text color to red", or "clear the screen". This layer parses those sequences and uses them to maintain an internal model of what the terminal grid should look like.
3. **The Renderer (Face):** A loop that reads our internal grid model and uses a graphics API to physically draw the characters onto your monitor, ideally 60 times per second without flickering.

Each layer only talks to the layers next to it. The renderer does not know anything about pipes. The parser does not know anything about fonts. This separation is what keeps the project manageable.

A journey of a thousand miles begins with a single step, so let's start with the plumbing.

### The Concept: Anonymous Pipes

To bridge our terminal application to the shell process, we need a way for two separate processes to exchange data. Windows provides several mechanisms for this named pipes, sockets, shared memory but for our use case, the right tool is an **anonymous pipe**.

An anonymous pipe is a one-way, in-memory data channel managed by the kernel. It has two ends: a read handle and a write handle. Whatever bytes you write into the write end come out the read end in the same order, like a queue. The kernel manages the buffer in between.

The "anonymous" part means it has no name it cannot be looked up by other processes. It can only be shared by passing the handle values to a child process at creation time, which is exactly what we are going to do.

Because a pipe is one-way, and we need two-way communication with the shell, we need two of them:

- **The Input Pipe:** Our application writes the user's keystrokes into the write end. ConPTY reads them from the read end and forwards them to the shell as if they came from a keyboard.
- **The Output Pipe:** ConPTY writes the shell's text output into the write end. Our application reads it from the read end to parse and render.

It helps to be precise about which ends go where. After we create both pipes, the handle ownership looks like this:

```
Our App  --[hInputWrite]--->  [Input Pipe]  --[hInputRead]-->  ConPTY  -->  cmd.exe
Our App  <--[hOutputRead]--  [Output Pipe]  <--[hOutputWrite]--  ConPTY  <--  cmd.exe
```

ConPTY sits in the middle, owning `hInputRead` and `hOutputWrite`. We own `hInputWrite` and `hOutputRead`. The shell process itself never touches the pipe handles directly ConPTY abstracts all of that away from it.

### Setting Up the Security Attributes

Let's start writing code. The first thing we need is a `SECURITY_ATTRIBUTES` struct:

````c
SECURITY_ATTRIBUTES saAttr = {0};
saAttr.nLength              = sizeof(SECURITY_ATTRIBUTES);
saAttr.bInheritHandle       = TRUE;
saAttr.lpSecurityDescriptor = NULL;
````

`SECURITY_ATTRIBUTES` appears all over the Win32 API. It controls two things: the security descriptor for the object being created (we pass `NULL` to get the default security, which is fine for our purposes), and whether the resulting handle can be inherited by child processes.

`bInheritHandle = TRUE` is the important one. When Windows creates a child process, it can optionally duplicate a set of handles from the parent process into the child. Setting this flag on the security attributes opts those handles into that system. Without it, the pipe handles we are about to create could not be passed to ConPTY or to the shell process.

`nLength` must always be set to `sizeof(SECURITY_ATTRIBUTES)`. Like many Win32 structs, this field acts as a version marker so the kernel knows which version of the struct it is looking at.

### Creating the Pipes

````c
HANDLE hInputRead  = NULL;
HANDLE hInputWrite = NULL;
HANDLE hOutputRead  = NULL;
HANDLE hOutputWrite = NULL;

if (!CreatePipe(&hInputRead, &hInputWrite, &saAttr, 0)) {
    fprintf(stderr, "Failed to create input pipe. Error: %lu\n", GetLastError());
    return 1;
}

if (!CreatePipe(&hOutputRead, &hOutputWrite, &saAttr, 0)) {
    fprintf(stderr, "Failed to create output pipe. Error: %lu\n", GetLastError());
    return 1;
}
````

`CreatePipe` takes four arguments. The first two are output parameters pointers to `HANDLE` variables that receive the read and write ends of the new pipe. The third is our security attributes struct. The fourth is the pipe buffer size in bytes; passing `0` tells Windows to use its default size, which is 4KB and is perfectly fine for us.

After both calls succeed, we have four handles: two read ends and two write ends, one pair per pipe. At this point none of them are connected to anything. The pipes exist in kernel memory, but they are just empty channels waiting for data.

### Creating the Pseudo Console

Now we create the ConPTY session itself and hand it the correct ends of our pipes:

````c
COORD terminalSize = {80, 24};

HRESULT hr = CreatePseudoConsole(terminalSize, hInputRead, hOutputWrite, 0, &hPC);
if (FAILED(hr)) {
    fprintf(stderr, "Failed to create Pseudo Console. HRESULT: 0x%08lX\n", hr);
    return 1;
}
````

`CreatePseudoConsole` takes five arguments:

- `terminalSize` a `COORD` specifying the initial width and height of the terminal grid in characters. 80x24 is the classic default, inherited from the days of physical 80-column terminals.
- `hInputRead` the read end of the input pipe. ConPTY will read keystrokes from here.
- `hOutputWrite` the write end of the output pipe. ConPTY will write shell output here.
- `0` creation flags. The only defined flag right now is `PSEUDOCONSOLE_INHERIT_CURSOR`, which we don't need.
- `&hPC` a pointer to an `HPCON` handle that receives the new pseudo console.

Notice that we pass `hInputRead` and `hOutputWrite` the ends that belong to ConPTY, not the ends we will use ourselves. From this point forward, ConPTY owns those two handles internally. This is a critical detail.

### Cleaning Up the Right Handles

This is the step that most tutorials either skip or underexplain, and it is the one most likely to cause you a silent, maddening deadlock hours later.

````c
CloseHandle(hInputRead);
CloseHandle(hOutputWrite);
````

We need to close `hInputRead` and `hOutputWrite` in our own process the same handles we just passed to `CreatePseudoConsole`.

Here is why. A pipe only signals "end of data" (EOF) when *every* process that holds the write end closes it. If we keep our own copy of `hOutputWrite` open, the output pipe will never EOF from our application's perspective. When the shell eventually exits and ConPTY closes its copy of `hOutputWrite`, there will still be one open write handle left ours. Our `ReadFile` loop will block forever waiting for data that will never come, because Windows sees an open write handle and assumes more data might still arrive. That is a deadlock.

The same logic applies to `hInputRead`. If we hold it open, ConPTY's internal read loop can behave unexpectedly when we eventually close `hInputWrite`.

The rule is simple: close any pipe end that belongs to the other side as soon as you have handed it off. Keep only the handles you are actually going to use yourself `hInputWrite` for sending keystrokes, and `hOutputRead` for reading output.

### What We Have So Far

If you compile and run this now, the program creates a ConPTY session, immediately cleans up the handles it doesn't need, then exits. You will see nothing `cmd.exe` has not been spawned yet, so nobody is connected to the other end of the pipes.

But the hard part is done. We have the pipes, we have the ConPTY, and we have the right handles in the right hands.

In the next part, we are going to use `CreateProcessW` with `STARTUPINFOEXW` to actually spawn `cmd.exe` and wire it to our ConPTY and we are going to learn why normal `CreateProcessW` is not enough to do that.