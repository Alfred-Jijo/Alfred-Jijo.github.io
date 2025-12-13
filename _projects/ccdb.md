---
layout: default
title: ccDB
description: A C project template
---

# ccDB

This is a basic C project template designed to provide a clean and organized starting point for your C development.
Ive designed it to be C with Quality of Life headers in base.

Plans are to create and include these things:

TODO: warden.h (Allocators)

- [x] **Logging**
- [ ] **Allocators**
- [ ] **Data Structures and Algorithms**

## Directory Structure
```
.
├── src/            # source dir
├── base/           # base headers
├── include/        # external includes
├── lib/            # external libs
├── docs/           # project docs
├── build/          # all build artifacts output
├── README.md       # This file
└── LICENSE         # Placeholder for your project's license
```

## How to Use This Template

1.  **Clone or Download**: Get this template to your local machine.
    * If you're using Git: `git clone https://codeberg.org/Alfred-Jijo/ccdb.git my_project`
    * Then `cd my_project`
2. **Building**
    * This project uses [mate.h](https://github.com/TomasBorquez/mate.h.git) for its building needs
    * It is included in this project
    * Build the mate.c already included to bootstrap the build system
    * POSIX systems:
    ```sh
    gcc -o mate mate.c
    clang -o mate mate.c
    ```
    * Windows
    ```cmd
    cl mate.c
    ```
3.  **Customize**:
    * Rename `project` 
    * Modify `src/main.c` and other files to suit your project's needs.
4.  **Build**: Open your terminal in the project's root directory and run:
    - `./mate` 
    - or
    - `mate.exe` on Windows\
    This will compile your source code and create the executable in the `build/` directory.

## License
This project is under the MIT License.
