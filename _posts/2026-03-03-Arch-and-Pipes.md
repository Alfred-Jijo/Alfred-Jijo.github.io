---
layout: post
title: "Building a Windows Terminal: Architecture & Anonymous Pipes"
series: "WinTer"
series_part: 2
---

## Architecture & Laying the Plumbing

Before Windows 10, building a terminal emulator on Windows was a nightmare. If you wanted to host `cmd.exe` or PowerShell in a custom window, you had to jump through ridiculous hoops—often spinning up a hidden console window off-screen and literally scraping the text from it to draw on your own UI.

Unix and Linux have always had a cleaner way of doing this using Pseudo-Terminals (PTYs). Finally, Microsoft caught up and introduced the **ConPTY (Windows Pseudo Console)** API.

But before we write any code, let's look at the big picture.

### Terminal Architecture

A terminal emulator acts as a middleman between you and the shell. To retrieve, parse, and draw data, our terminal will go through a chain of components.

We can split our architecture into three main layers:

1. **The OS Interface (Plumbing):** This handles spawning the shell process (`cmd.exe`), attaching it to ConPTY, and managing the memory pipes that stream the raw byte data back and forth.
2. **The State & Parser (Brain):** The raw stream coming from the OS is full of invisible ANSI escape sequences. This layer parses those sequences to update the state of our text buffer (e.g., moving the cursor, changing text to red, or clearing the screen).
3. **The Renderer (Face):** A loop that reads our internal text buffer 60 times a second and uses a graphics API to physically draw the characters to your monitor.

A journey of a thousand miles begins with a single step, so let’s start with the OS Interface: the plumbing.

### The Concept: Anonymous Pipes

To establish a communication bridge between our custom C application and the Windows OS, we use **Anonymous Pipes**.

An anonymous pipe is simply a one-way data channel in memory. Because we need a two-way conversation (typing commands in, reading text out), we need to create *two* pipes:

* **The Input Pipe:** Our terminal application writes the user's keystrokes into one end, and ConPTY reads them from the other.
* **The Output Pipe:** ConPTY writes the shell's text output into one end, and our application reads it from the other to draw to the screen.

### The Win32 API Setup

Let's start writing the C code. First, we need to set up our headers, handle variables, and security attributes.

```c
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>

int main() {
    HRESULT hr = S_OK;
    HPCON hPC = NULL;

    HANDLE hInputRead = NULL, hInputWrite = NULL;
    HANDLE hOutputRead = NULL, hOutputWrite = NULL;

    SECURITY_ATTRIBUTES saAttr = {0};
    saAttr.nLength = sizeof(SECURITY_ATTRIBUTES);
    saAttr.bInheritHandle = TRUE;
    saAttr.lpSecurityDescriptor = NULL;
```

Notice the `bInheritHandle = TRUE` line. We must explicitly tell Windows that the pipe handles we are about to create are allowed to be inherited by child processes. If we don't do this, the shell we eventually spawn won't be able to talk to our pipes.

Now, let's actually create the input and output pipes using `CreatePipe`.

```c
    if (!CreatePipe(&hInputRead, &hInputWrite, &saAttr, 0)) {
        printf("Failed to create input pipe.\n");
        return 1;
    }

    if (!CreatePipe(&hOutputRead, &hOutputWrite, &saAttr, 0)) {
        printf("Failed to create output pipe.\n");
        return 1;
    }
```

At this point, we have our two separate memory channels. Now we need to spin up the Pseudo Console itself and hand it the correct ends of these pipes.

```c
    COORD terminalSize = {80, 24};

    hr = CreatePseudoConsole(terminalSize, hInputRead, hOutputWrite, 0, &hPC);
    if (FAILED(hr)) {
        printf("Failed to create Pseudo Console.\n");
        return 1;
    }

    printf("Successfully created ConPTY\n");
```

We pass `CreatePseudoConsole` our requested terminal size (a standard 80x24 grid), the read end of our input pipe, and the write end of our output pipe.

### Cleaning up Handles

There is one final, crucial step for this part.

```c
    CloseHandle(hInputRead);
    CloseHandle(hOutputWrite);

    // TODO: Spawn the shell and hook it up to the Pseudo Console

    ClosePseudoConsole(hPC);
    CloseHandle(hInputWrite);
    CloseHandle(hOutputRead);

    return 0;
}
```

When we called `CreatePseudoConsole`, the OS took ownership of the `hInputRead` and `hOutputWrite` ends of the pipes. If we keep our own copies of those handles open in our parent application, it will cause deadlocks later when we try to read from a pipe that Windows thinks is still waiting for data. Closing handles you don't need is standard Win32 hygiene.

Right now, if you compile and run this, it will just briefly flash "Successfully created ConPTY" and exit. We have the plumbing, but no water is flowing through it yet.

In the next part, we will use the `CreateProcess` API to actually spawn `cmd.exe` and attach it to the Pseudo Console we just built.