---
layout: post
title: "Building a Windows Terminal: Spawning the Shell"
series: "WinTer"
series_part: 3
---

## Spawning the Shell

In the last part, we built our plumbing. We have two anonymous pipes and a live ConPTY session. But if you run what we have right now, `cmd.exe` isn't anywhere to be seen. We have a pseudo console with nobody home.

The fix is `CreateProcessW`. But we can't just call it like we normally would, and understanding *why* requires us to understand a bit about how Windows manages process creation.

### A Brief History of Process Creation on Windows

`CreateProcessW` is one of the oldest Win32 APIs. It has been around since Windows NT 3.1. Over the decades, Microsoft needed to add new capabilities to it things like CPU group affinity, security mitigations, and eventually ConPTY support but they couldn't just add new parameters to `CreateProcessW` itself. That would break every existing program that called it.

Their solution was `STARTUPINFOEXW`. The original `STARTUPINFOW` struct has a field called `cb` which stores the size of the struct. Windows uses this as a version tag when `CreateProcessW` receives a pointer to a startup info struct, it reads `cb` first to figure out how big the struct actually is and therefore which version it's looking at.

`STARTUPINFOEXW` is just `STARTUPINFOW` with one extra field bolted on the end:

````c
typedef struct _STARTUPINFOEXW {
    STARTUPINFOW StartupInfo;
    LPPROC_THREAD_ATTRIBUTE_LIST lpAttributeList;
} STARTUPINFOEXW;
````

That `lpAttributeList` is the key. It is a dynamically allocated list of key-value pairs that get attached to the new process before it starts. One of those keys is `PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE`, which is how we wire our ConPTY to the shell.

Without this, there is no other way to attach a ConPTY to a process. You cannot do it after the fact. It has to happen at creation time, through this attribute list.

### Allocating the Attribute List

The attribute list is not a simple struct it is an opaque blob of memory whose size depends on how many attributes you want to attach. Microsoft doesn't tell you the size upfront. Instead, you have to ask.

````c
SIZE_T attr_list_size = 0;
InitializeProcThreadAttributeList(NULL, 1, 0, &attr_list_size);
````

This first call is a dry run. We pass `NULL` for the list pointer, `1` for the number of attributes we want, and a pointer to `attr_list_size`. Windows fills in exactly how many bytes we need and returns `FALSE` with `GetLastError()` returning `ERROR_INSUFFICIENT_BUFFER` which is expected. It is just telling us the size.

Now we allocate:

````c
LPPROC_THREAD_ATTRIBUTE_LIST attr_list =
    (LPPROC_THREAD_ATTRIBUTE_LIST)HeapAlloc(
        GetProcessHeap(), 0, attr_list_size);
````

You might wonder why we use `HeapAlloc` instead of `malloc`. Technically either would work here since we are in a single-heap process. But `HeapAlloc` is the idiomatic Win32 choice for memory that is going to be handed directly to a Win32 API. It allocates from the process's default heap, the same heap the C runtime uses under the hood. There is no practical difference here, but using it signals intent this memory is for the OS, not for our own data structures.

Now we initialise the list for real:

````c
InitializeProcThreadAttributeList(attr_list, 1, 0, &attr_list_size);
````

Same call, same arguments, but this time with a real pointer. After this, `attr_list` is a valid, empty attribute list with room for one entry.

### Wiring the ConPTY

Now we attach our ConPTY handle to the list:

````c
UpdateProcThreadAttribute(
    attr_list,
    0,
    PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE,
    hPC,
    sizeof(HPCON),
    NULL,
    NULL);
````

Let's go through each argument because most of them are non-obvious:

- `attr_list` the list we just initialised.
- `0` reserved flags, always zero.
- `PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE` the key. This tells Windows what kind of attribute we are setting.
- `hPC` a pointer to the value. Note that `hPC` is already a handle (a pointer-sized value), so we are passing a pointer to a handle here.
- `sizeof(HPCON)` the size of the value.
- The two `NULL` values at the end are for previous value and return size, which we don't care about.

After this call, the attribute list knows: "any process created with me should be connected to this ConPTY."

### The `STARTUPINFOEXW` Setup

````c
STARTUPINFOEXW si = {0};
si.StartupInfo.cb = sizeof(STARTUPINFOEXW);
si.lpAttributeList = attr_list;
````

The zero initialisation `= {0}` is important it zeros out the entire `STARTUPINFOW` embedded struct, which has fields for things like window position, console title, and standard handle overrides. We don't want any garbage values in there.

`si.StartupInfo.cb` must be `sizeof(STARTUPINFOEXW)`, not `sizeof(STARTUPINFOW)`. This is the version tag we talked about earlier. If you pass `sizeof(STARTUPINFOW)` here, Windows will not read the `lpAttributeList` field at all it thinks it's looking at an old-style struct that doesn't have one. Your ConPTY will never get attached, and `cmd.exe` will spawn with no console at all, probably crash silently, or just produce no output. This is one of those bugs that is completely silent and maddening to track down.

### Spawning the Process

````c
PROCESS_INFORMATION pi = {0};

BOOL success = CreateProcessW(
    NULL,           // No explicit application name
    L"cmd.exe",     // Command line
    NULL,           // Default process security
    NULL,           // Default thread security
    FALSE,          // Do NOT inherit handles
    EXTENDED_STARTUPINFO_PRESENT,
    NULL,           // Inherit environment from parent
    NULL,           // Inherit current directory from parent
    &si.StartupInfo,
    &pi);

if (!success) {
    fprintf(stderr, "CreateProcessW failed. Error: %lu\n", GetLastError());
}
````

There are a few things here that deserve explanation.

**`NULL` for the application name.** Windows resolves `cmd.exe` by searching the system PATH, so we don't need to provide a full path. If you wanted to be explicit you could pass `L"C:\\Windows\\System32\\cmd.exe"`, but letting Windows find it is fine for our purposes.

**`FALSE` for `bInheritHandles`.** This might seem strange in the last part we set `bInheritHandle = TRUE` on our `SECURITY_ATTRIBUTES` when creating the pipes. That was specifically so the pipe ends *could* be inherited. But here we are saying don't inherit handles. What gives?

The distinction is between *capability* and *action*. Setting `bInheritHandle = TRUE` on the security attributes makes a handle *inheritable* it opts that handle into the inheritance system. Setting `bInheritHandles = FALSE` in `CreateProcessW` turns off handle inheritance for this particular process creation. We are not using inheritance to pass the pipe handles to `cmd.exe` we are using the ConPTY attribute to do that. The ConPTY internally manages its own copies of the pipe handles. If we also enabled inheritance, `cmd.exe` would get extra copies of handles it doesn't know about, which can cause subtle pipe-lifetime bugs and deadlocks later. `FALSE` is the right choice here.

**`EXTENDED_STARTUPINFO_PRESENT`.** This flag in `dwCreationFlags` is what tells `CreateProcessW` to treat the startup info pointer as a `STARTUPINFOEXW` rather than a plain `STARTUPINFOW`. Without it, even though we pass `sizeof(STARTUPINFOEXW)` in `cb`, Windows will ignore `lpAttributeList` completely. You need both the correct `cb` size *and* this flag. One without the other is not enough.

### What `PROCESS_INFORMATION` Gives Us

After a successful `CreateProcessW`, `pi` is populated with four values:

````c
typedef struct _PROCESS_INFORMATION {
    HANDLE hProcess;  // Handle to the new process
    HANDLE hThread;   // Handle to the new process's main thread
    DWORD  dwProcessId; // Process ID (PID)
    DWORD  dwThreadId;  // Thread ID
} PROCESS_INFORMATION;
````

`hProcess` lets us do things like wait for the process to exit, terminate it, or query its exit code. `hThread` is the main thread's handle. For our purposes right now we don't need either of them we communicate with the shell entirely through the pipes. But we do need to close them when we are done with them.

### Cleaning Up

````c
CloseHandle(pi.hThread);
CloseHandle(pi.hProcess);

DeleteProcThreadAttributeList(attr_list);
HeapFree(GetProcessHeap(), 0, attr_list);
````

`CloseHandle` on the process and thread handles does not kill the process `cmd.exe` keeps running. It just releases our reference to those kernel objects. If we don't close them, they stay alive in our process's handle table until we exit, which is a handle leak.

`DeleteProcThreadAttributeList` does internal cleanup on the attribute list before we free the memory. Always call this before `HeapFree` skipping it can leak memory inside the kernel.

### What We Have Now

At this point, if you compile and run, `cmd.exe` is alive and fully connected to your ConPTY. The shell has started, run its initialisation, printed its banner text, and is sitting at a prompt waiting for input. All of that output every byte of it has been written into your `hOutputRead` pipe.

But we can't see any of it yet.

The output is sitting in the pipe buffer. If we don't read it, that buffer fills up. When the buffer is full, `cmd.exe`'s next write into the pipe blocks. The shell freezes. Nothing moves. Eventually, if we try to write to the input pipe, we deadlock. The whole thing hangs silently.

The solution is a dedicated reader thread a thread whose only job is to sit in a loop calling `ReadFile` on `hOutputRead` and drain whatever comes out. That is what we are building next.

In the next part, we will spin up that reader thread, and for the first time we will actually see raw terminal output flowing through our application.