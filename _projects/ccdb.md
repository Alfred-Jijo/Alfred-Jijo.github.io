---
layout: default
title: ccDB
description: A C project template
---
# ccDB

> [https://alfred-jijo.github.io/docs/ccdb/index.html](https://alfred-jijo.github.io/docs/ccdb/index.html)

A high-performance, modern C project template designed to provide a clean, zero-dependency starting point for professional C development.

This template drags C into the modern era by providing "Quality of Life" features commonly found in languages like Odin, Zig, and Rust—such as string slices, exact-width types, and virtual memory arenas—without sacrificing the raw speed and simplicity of standard C.

## Features

- **No Bloat:** Zero external dependencies. Everything is built from scratch.
- **Virtual Memory Arenas:** A professional `Arena` allocator built directly on top of OS-level virtual memory (`VirtualAlloc` / `mmap`). Reserve gigabytes of address space instantly and commit physical RAM only as needed. Say goodbye to `malloc`, `free`, and memory leaks.
- **Sized Strings (Slices):** Fast, allocation-free string manipulation using pointer/length pairs (`String8`), completely eliminating buffer overflows and `strlen` overhead.
- **Modern Types & Macros:** Exact-width integers (`u8`, `i32`, `usize`), type-safe evaluation macros (`MIN`, `MAX`, `CLAMP`), and intrusive linked-list tools.
- **Professional Logging:** A thread-safe, leveled logger with colored console output and multi-sink (file/callback) support.
- **Built-in Testing:** A lightweight, Unity-Build based testing harness that compiles and runs in milliseconds.
- **Frictionless Build System:** A highly tuned CMake configuration that uses `CONFIGURE_DEPENDS` to automatically detect new `.c` files without needing manual CMake reloads.

---

## Directory Structure

```text
.
├── include/            # Public APIs and headers
│   ├── base/           # Core primitives (types, strings, macros, logging)
│   └── memory/         # Allocators (Arena and OS memory wrappers)
├── src/                # Implementation files and Application code
│   ├── base/           # Internal base implementations
│   ├── memory/         # OS-level memory implementations
│   └── main.c          # Application entry point
├── lib/                # (Optional) Drop external libraries here
├── test/               # Custom test harness and unit tests
├── docs/               # Doxygen generated documentation output
├── build/              # All build artifacts and binaries end up here
└── CMakeLists.txt      # Root build configuration
```

---

## Getting Started

### Clone the Template
Get this template to your local machine:
```sh
git clone https://gitlab.com/Alfred-Jijo/ccdb.git my_project
cd my_project
```

### Build the Project
This project uses **CMake** (Minimum v3.13) wrapped in convenient build scripts. You don't need to manually invoke CMake.

* **Windows:**
  ```cmd
  build.bat
  ```
* **Linux / macOS:**
  ```sh
  ./build.sh
  ```

*(Note: The build scripts automatically handle creating the `build/` directory, generating the CMake cache, and compiling the executable.)*

### Run the Application
The build scripts output the compiled binaries into the `build/bin/` directory.

* **Windows:** `build\bin\debug_ccdb.exe`
* **Linux / macOS:** `./build/bin/debug_ccdb`

### Run the Tests
To ensure the core systems are working correctly on your specific OS/Architecture, run the included test suite:

* **Windows:** `build\bin\tests_ccdb.exe`
* **Linux / macOS:** `./build/bin/tests_ccdb`

---

## Roadmap

- [x] Base Primitives (Types, Math Macros, Context Cracking)
- [x] Sized Strings / String Slices
- [x] Logging Subsystem
- [x] Automated Testing Suite
- [x] Allocators
	- [x] OS Virtual Memory Wrapper
	- [x] Arena Allocator
	- [ ] Pool Allocator
- [ ] Data Structures and Algorithms
    - [x] Intrusive Linked Lists
    - [ ] Array Lists
    - [ ] Stacks & Queues
    - [ ] Hash Maps

## License

See the [LICENSE](./LICENSE) file for details.