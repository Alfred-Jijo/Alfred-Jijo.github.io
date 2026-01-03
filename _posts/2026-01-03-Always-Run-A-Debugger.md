# Debugging is your best friend

## The Industry Reality

If you are reading this, you likely aspire to work on systems where "reliability" isn't a buzzword it is a contractual obligation. I’m talking about high-frequency trading platforms, embedded medical devices, operating system kernels, or the traffic-shaping infrastructure at places like Cloudflare.

In these environments, the habit of "writing code, running it, and hoping it works" is not just amateurish; it is dangerous.

The average Computer Science student treats the compiler like a spellchecker and the runtime execution like a slot machine. They pull the lever (`./main`), watch it crash, and then frantically start changing lines of code, hoping to hit the jackpot. This is the **"Run and Pray"** methodology.

In professional systems engineering, we do not pray. We observe.

The difference between a Junior Developer and a Systems Engineer is the **Debug-First Mindset**. We do not use a debugger solely to fix bugs; we use it to verify logic as we write it. We treat the memory of the computer not as an abstract black box, but as a territory we must survey, map, and control.

Today, we are going to learn this mindset. We will not use "easy" tools. We are going to use **GDB (The GNU Project Debugger)**. It is the engine that powers the "friendly" debug buttons in VS Code and CLion. If you master GDB, you master the machine.

***

## The Data Structure

To learn debugging, we need a subject worth debugging. Arrays are too safe; the memory is contiguous and managed easily. To understand the dangers of memory management, we need **Linked Lists**.

### Why Linked Lists?

In systems programming, you often don't know how much data you will receive. If you are writing a network driver buffering packets, you cannot pre-allocate a massive array. You need a structure that grows dynamically, consuming memory only when needed and freeing it immediately when done.

A Linked List is a chain of "Nodes." Unlike an array, these nodes are not neighbors in memory. They can be scattered anywhere in the RAM.
* **The Payload:** The actual data (an Integer, a User ID, a Texture).
* **The Pointer:** A map coordinate (memory address) telling us where the *next* node lives.

### Phase 1: The Scaffold
Let's define our structure. We will build a simple "Job Queue" system.

```c
#include <stdio.h>
#include <stdlib.h>

// The Node Structure
typedef struct Job {
	int id;			// The Payload
	struct Job *next;	// The Pointer to the next job
} Job;

// The Head of our list (Global for simplicity in this tutorial)
Job *head = NULL;
```

When we create a new `Job`, we cannot just declare it on the stack (local variable), or it will vanish when the function returns. We must ask the Operating System for a permanent slice of the Heap using `malloc`.

### Phase 2: The Append Function

We need a way to add jobs to our list. This requires a "Walker." We cannot jump to the end of the list; we must start at the `head` and walk down the chain of pointers until we find the end (where `next` is `NULL`).

```c
// Create a new job
Job *
create_job(int id)
{
	Job *new_job = (Job *)malloc(sizeof(Job));
	if (new_job == NULL) {
		fprintf(stderr, "Out of memory!\n");
		exit(1);
	}
	new_job->id = id;
	new_job->next = NULL;
	return new_job;
}

// Add to the end of the list
void
append_job(int id)
{
	Job *new_job = create_job(id);

	// Case 1: List is empty
	if (head == NULL) {
		head = new_job;
		return;
	}

	// Case 2: List has items. Walk to the end.
	Job *current = head;
	while (current->next != NULL) {
		current = current->next; // The "Walker" step
	}

	// Link the last node to the new node
	current->next = new_job;
}
```

This code is safe. It is standard. But now, we are going to introduce the threat.

***

## The Trap (The "Delete" Function)

Memory management is a double-edged sword. If you `malloc`, you must `free`.

We need a function to remove a completed job from the list. We will iterate through the list, find the job with the matching ID, unhook it from the chain, and return the memory to the OS.

I am going to provide you with a `delete_job` function. **Read it carefully.** It looks correct. It compiles without warnings. It handles the pointer logic to "stitch" the list back together.

But it contains a **Use-After-Free** bug. This is one of the most common and deadly vulnerabilities in C/C++.

```c
// WARNING: This function contains a subtle, deadly bug.
void
delete_job(int id)
{
	Job *current = head;
	Job *prev = NULL;

	while (current != NULL) {
		if (current->id == id) {
			// Found the job! Unlink it.
			if (prev == NULL) {
				// We are deleting the head
				head = current->next;
			} else {
				// We are deleting a middle/end node
				prev->next = current->next;
			}

			printf("Deleting Job ID: %d\n", current->id);

			// We free the memory. The OS now owns this address.
			free(current);

			// We continue the loop.
			// PROBLEM: To continue, the loop does 'current = current->next' logic?
			// Actually, we need to advance 'current' manually here if we don't break.

			// Let's assume we want to delete ALL jobs with this ID, so we don't 'break'.
			// We simply move to the next node to keep checking.
			current = current->next;
		} else {
			// Not the job, move forward
			prev = current;
			current = current->next;
		}
	}
}
```

Do you see the error?
We call `free(current)`. This tells the OS, "I am done with the memory at address X."
Immediately after, in the very next line, we write `current = current->next`.
We are asking the computer to look at address X, find the `next` variable inside it, and read it.
**But we just destroyed address X.**

***

## The Failure (The "Run & Pray" Method)

Let’s assemble the full program (`main.c`) and see what happens when we try to run this blindly.

### The Full Source Code (`main.c`)

Copy this into a file named `main.c`.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct Job {
	int id;
	struct Job *next;
} Job;

Job *head = NULL;

Job *
create_job(int id)
{
	Job *new_job = (Job *)malloc(sizeof(Job));
	new_job->id = id;
	new_job->next = NULL;
	return new_job;
}

void
append_job(int id)
{
	Job *new_job = create_job(id);
	if (head == NULL) {
		head = new_job;
		return;
	}
	Job *current = head;
	while (current->next != NULL) {
		current = current->next;
	}
	current->next = new_job;
}

void
print_jobs()
{
	Job *current = head;
	printf("Job Queue: ");
	while (current != NULL) {
		printf("[%d] -> ", current->id);
		current = current->next;
	}
	printf("NULL\n");
}

void
delete_job(int id)
{
	Job *current = head;
	Job *prev = NULL;

	while (current != NULL) {
		if (current->id == id) {
			if (prev == NULL)
				head = current->next;
			else
				prev->next = current->next;

			printf("Deleting Job ID: %d\n", current->id);
			free(current);		 // The Trap is sprung here
			current = current->next; // The illegal access
		} else {
			prev = current;
			current = current->next;
		}
	}
}

int
main()
{
	// Fill the list
	append_job(101);
	append_job(102);
	append_job(103);
	append_job(104);

	print_jobs();

	// Trigger the bug
	// We try to delete 102. It is in the middle of the list.
	// The function will free 102, then try to read 102->next to find 103.
	printf("Attempting to delete Job 102...\n");
	delete_job(102);

	print_jobs();
	return 0;
}
```

### The Amateur Execution

Now, compile and run this the way most students do.

```bash
$ gcc main.c -o main
$ ./main
```

**Output:**

```text
Job Queue: [101] -> [102] -> [103] -> [104] -> NULL
Attempting to delete Job 102...
Deleting Job ID: 102
Segmentation fault (core dumped)
```

**The Game Over Screen.**

At this point, the average student feels frustration.
*"Why? I freed the memory! The logic looks right!"*
They might start adding `printf("Here 1");` lines.
They might stare at the code for 20 minutes.
They are guessing.

We are not going to guess. We are going to perform an autopsy.

***

## The "Developer Tools" (GDB & Flags)

To fix this, we need to see what the CPU sees. We need to enable the "Developer Tools" of our trade.

### The Compiler Flags

We must recompile. Standard `gcc` builds a binary that is optimized for speed, not readability. It strips out variable names and line numbers to save space. We need to reverse this.

1. **`-g`**: This adds **Debug Symbols**. It creates a map inside the binary that links the machine code instructions back to your `main.c` source file.
2. **`-O0`**: This disables **Optimization**. We don't want the compiler inlining functions or re-ordering loops. We want the execution to happen exactly line-by-line as we wrote it.

```bash
$ gcc -g -O0 main.c -o debug
```

### Launching the Environment

Now, we load the binary into GDB.

```bash
$ gdb ./debug
```

You are now in the GDB console. It looks stark, but it is powerful.
However, we want to see our code. We are going to enable **TUI (Text User Interface) Mode**.

**Command:** `layout src`
*(Note: If the layout looks scrambled, press `Ctrl+L` to refresh the screen.)*

You should now see your C code in the top half of the terminal and the command prompt in the bottom half. This is your cockpit.

***

## The Investigation

We know the crash happens inside `delete_job`. Let’s catch the program in the act.

### Setting the Trap

We will set a **Breakpoint** at the `delete_job` function. This tells the CPU: *"Run at full speed until you hit this function, then freeze."*

```gdb
(gdb) break delete_job
Breakpoint 1 at 0x11e9: file main.c, line 43.
```

Now, run the program.

```gdb
(gdb) run
```

The program will print the queue and then stop.

```gdb
Breakpoint 1, delete_job (id=102) at main.c:43
43          Job *current = head;
```

### The Step-Through

We are now effectively in "God Mode." Time is frozen.
Use the `next` command (or just type `n`) to step through the code line by line.

Type `n` and hit Enter repeatedly. Watch the highlight in the top window.

1. We initialize `current` and `prev`.
2. We enter the `while` loop.
3. We check `if (current->id == id)`.

The first item is 101. Our target is 102.
So it enters the `else` block.
It updates `prev` and advances `current`.
The loop restarts.

**Inspect the State:**
Now `current` should be pointing to Job 102. Let's verify.

```gdb
(gdb) print *current
$1 = {id = 102, next = 0x5555555592e0}
```

Correct. It holds ID 102. It has a valid `next` pointer.

### The Critical Moment

Keep pressing `n`.
We enter the `if (current->id == id)` block.
We handle the pointer stitching (linking 101 to 103).
We print "Deleting Job ID: 102".

Now, the highlight is on:
`53          free(current);`

**STOP.**
Before we execute this line, look at `current` one last time.

```gdb
(gdb) p current
$2 = (Job *) 0x5555555592c0
```

Memorize that address (it will end in something like `c0` or `a0`).

Execute the free:

```gdb
(gdb) n
```

The memory at `0x5555555592c0` is now marked as "free." It is dead.
The highlight is now on:
`54          current = current->next;`

### The "Hacker" Move: Raw Memory Inspection

Before we execute line 54, let's look at the raw memory of the node we just freed. GDB lets us look at the raw bytes in RAM.

**Command:** `x/4wx current`

* `x`: Examine memory.
* `/4`: Show 4 chunks.
* `w`: Word size (32-bit/4 bytes).
* `x`: Hexadecimal format.

```gdb
(gdb) x/4wx current
0x5555555592c0: 0x00000000      0x00000000      0x00000000      0x00000000
```

*Note: Depending on your specific `libc` implementation, this might look like garbage data, or it might be zeroed out, or it might contain metadata for the memory allocator. The point is: **It is no longer your data.***

### The Crash

Now, execute line 54.

```gdb
(gdb) n
```

**BOOM.**

```gdb
Program received signal SIGSEGV, Segmentation fault.
0x000055555555526a in delete_job (id=102) at main.c:54
54          current = current->next;
```

GDB tells you exactly what happened.

1. You are at line 54.
2. You tried to read `current->next`.
3. But `current` points to the memory you just passed to `free()`.
4. The OS intervened and killed your process for illegal memory access.

You didn't need to guess. You didn't need 20 print statements. You watched it happen in slow motion.

***

## The Fix & Production Value

Now that we understand the mechanism of the failure, the fix is obvious. We need to save the "next" pointer *before* we destroy the current node.

We need a life raft to jump to before we burn the ship.

### The Fix

Exit GDB (`quit` or `q`). Open `main.c`.

Change the logic inside the `if` block:

```c
		if (current->id == id) {
			if (prev == NULL)
				head = current->next;
			else
				prev->next = current->next;

			printf("Deleting Job ID: %d\n", current->id);

			// THE FIX: Save the next pointer safely
			Job *temp_next = current->next;

			free(current); // Destroy the node

			// Use the saved pointer to advance
			current = temp_next;
		}
```

### Verification

Recompile (`gcc -g -O0 ...`) and run in GDB.
You can run it cleanly this time.

```gdb
(gdb) run
Job Queue: [101] -> [102] -> [103] -> [104] -> NULL
Attempting to delete Job 102...
Deleting Job ID: 102
Job Queue: [101] -> [103] -> [104] -> NULL
[Inferior 1 (process 12345) exited normally]
```

### Why This Matters in Industry

In this simple example, you *might* have spotted the bug by reading the code.
But imagine you are at Google or Meta. You are debugging a C++ backend service.

* The `delete_job` function is 400 lines long.
* It calls five other functions.
* The `Job` struct has 50 members.
* The crash only happens once every 10,000 requests.

You cannot `printf` your way out of that.
You need to attach a debugger to the running process, inspect the **Call Stack** (using the `bt` command in GDB), and see exactly which sequence of events led to the corruption.

By using GDB on this small example, you are building the muscle memory required to maintain massive, critical systems.

***

## Conclusion

You have just learned the "Debugger Method."

1. **Stop guessing.**
2. **Instrumentation:** Use `-g` and `-O0`.
3. **Observation:** Use Breakpoints to freeze time.
4. **Inspection:** Use `print` and `x` to verify your assumptions about memory.
5. **Correction:** Fix based on evidence, not intuition.

This skill is universal.

* In **VS Code**, when you hover over a variable, the IDE is running `print` in the background.
* In **Java**, the JVM debugger works on the same principles of breakpoints and stack inspection.
* In **Python**, `pdb` allows you to step through scripts exactly like we did here.

The tools may change their skin, but the core engineering principle remains the same:
**Do not trust what you think the code is doing. Watch what it actually does.**

Now, go clean up your own code. Happy debugging.
