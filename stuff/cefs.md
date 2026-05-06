---
layout: directory
title: My Stuff
description: A collection of random experiments and side tools.
---

# Embedded Binary Store (EBIN)

A Lightweight Encrypted Storage API for Resource-Constrained Hardware

---

## What This Project Is

A lightweight encrypted storage API written in C that runs on resource-constrained hardware (ESP32, Raspberry Pi Pico, Arduino, etc.).

You call the API, it encrypts your data and stores it in the custom `.ebin` binary format.

A demo application (likely FTP-based or similar file transfer) will be built on top to show the API working in a real scenario but this is not the focus of the dissertation.

---

## Why C?

C is the lingua franca of embedded and systems programming. Choosing C means:

- The API can be called from **any language with a C FFI** - C++, Zig, Go, Rust, Python (via ctypes), and more
- It works natively on every microcontroller and embedded platform without additional tooling
- It is the standard for embedded development
- Portability can be demonstrated by calling the same API from multiple languages if needed

This is a deliberate engineering decision, not just a preference. A Zig or C++ implementation would limit who can use the library. A C implementation makes it universally applicable.

---

## The Research Question

> *"Can a practical encrypted storage API be implemented efficiently enough to run on resource-constrained hardware, and what are the trade-offs in doing so?"*

The answer involves benchmarking:

- **Speed** - how long does encryption/decryption take on the target hardware?
- **Memory usage** - how much RAM and flash does the API consume?
- **Storage overhead** - how much larger is a `.ebin` file compared to the original data?

---

## The Encryption

- **Symmetric** - same key to lock and unlock (faster, simpler)
- **Asymmetric** - different keys for locking and unlocking (slower, more flexible)

I'm going to use **symmetric encryption** because it is simpler to implement and fast enough for constrained hardware.

### Algorithm: AES (Advanced Encryption Standard)

AES is the industry standard symmetric algorithm used in WhatsApp, banking, TLS, and almost everything else.

---

## The .ebin File Format

Files produced by the API are stored in a custom binary format with the `.ebin` extension

### Layout

| Section | Field | Size | Purpose |
|---|---|---|---|
| **Header** | Magic bytes | 4 bytes | Identifies this as a `.ebin` file (e.g. `EBIN\0`) |
| | Version | 1 byte | Which version of the format this is |
| | Flags | 1 byte | Bit switches (e.g. compressed?, signed?) (Probably removable) |
| **Metadata** | Algorithm ID | 1 byte | Which algorithm was used (e.g. `0x01` = AES-128) |
| | IV | 16 bytes | Initialisation vector random noise needed for decryption |
| | Original data size | 8 bytes | Size before encryption, used to strip padding after decryption |
| | Filename length | 2 bytes | How long the filename field below is |
| | Filename | variable | Original filename as UTF-8 |
| **Data** | Padding | 0–15 bytes | Fills the last block to a multiple of 16 |
| | Encrypted data | n × 16 bytes | The actual content in AES blocks |

---

## The API

The core deliverable is a C API. A consuming application would use it roughly like this:

```c
// Encrypt and store data
ebin_store("file.ebin", data, data_len, key, key_len);

// Read and decrypt data
ebin_load("file.ebin", output_buf, &output_len, key, key_len);
```

The API handles everything internally - padding, IV generation, header construction, and AES encryption. The caller does not need to know anything about the format.

---

## The Demo Application

A simple demo will be built on top of the API to show it working in a real scenario.

Current candidate: an FTP-style file transfer where files are encrypted before being stored and decrypted on retrieval.

This is deliberately kept simple, the demo exists to prove the API is useful, not to be a project in itself.

---

## Target Hardware

The API will be developed and benchmarked on at least one resource-constrained device:

- **ESP32** (32-bit, dual core, ~520KB RAM)
- **Raspberry Pi Pico** (32-bit ARM Cortex-M0+, 264KB RAM)
- **Arduino** (8/16-bit AVR, very limited RAM most challenging target)

Running the same API across multiple hardware targets and comparing results would make for strong benchmark data in the dissertation.

---

## Current Dissertation Format

1. **Introduction** - the problem, why encryption on constrained hardware matters, why C
2. **Literature review** - existing work on lightweight crypto, AES on embedded systems, C FFI portability
3. **Design** - the `.ebin` format, the API design, algorithm choice
4. **Implementation** - how AES was implemented in C, key engineering decisions
5. **Testing** - correctness testing, edge cases, corrupted file handling
6. **Evaluation** - benchmarks across hardware targets, trade-offs, what would be done differently
7. **Conclusion** - answers the research question, suggests future work

---

## Portability Demo

Because the API is written in C, the same compiled library can be called from other languages. If time allows, a short demonstration calling the API from C++, Zig, or Python would show the portability argument in action.

---

## Tech Stack

| Thing | Choice |
|---|---|
| Language | C (C99) |
| Algorithm | AES (symmetric, implemented from scratch) |
| File format | Custom binary (`.ebin`) |
| Demo application | FTP-style file transfer |
| Target hardware | ESP32 / Raspberry Pi Pico / Arduino |
| Testing | Unity (C testing framework) or manual test harness |

---

## Embedded Storage Problem

Traditional storage APIs assume a device has an HDD or SSD, plenty of RAM, and a filesystem. Microcontrollers have none of these:

- **Flash memory** - where code and persistent data lives. Fast to read, slow to write, and limited to a finite number of write cycles before it degrades. Every unnecessary write shortens the device's life.
- **RAM** - where the program runs. As little as 2KB on an Arduino. You cannot load a whole file into memory to encrypt it, may need to process it in chunks.
- **No filesystem** - you are writing raw bytes to flash addresses. There is no OS managing files for you.

The goal of EBIN is to work within these constraints: minimising RAM usage during encryption, minimising flash writes, and keeping the `.ebin` format as compact as possible. Every byte of header overhead is flash you are wasting.

The API is also designed so any application can call it with minimal integration cost, simple function calls, no knowledge of the format required, any language with a C FFI can use it.

---

## Encryption, Compression, and Speed

In any embedded storage system I have to juggle between three properties:

- **Encryption** - keeps data secure, but is computationally expensive
- **Compression** - reduces storage size, but is also computationally expensive
- **Speed** - fast read/write, but doing less processing means accepting larger or less secure data

The problem is you can only fully optimise two of the three at once:

| Priority | What you get | What you sacrifice |
|---|---|---|
| Encryption + Compression | Small and secure | Slow - two expensive operations on a tiny chip |
| Encryption + Speed | Secure and fast | Larger files - no compression overhead |
| Compression + Speed | Small and fast | Not secure - no encryption |

For a resource-constrained device running AES from scratch, adding compression on top may make the system too slow to be practical. The dissertation will justify which two of the three EBIN optimises for, likely **Encryption + Speed**, and explain why that is the right trade-off for the target hardware.

This decision will be supported by benchmark data showing encryption speed and memory usage across different hardware targets.

---

## Header Design Goals

The `.ebin` header is designed to be as small as possible while retaining everything needed to decrypt the data:

- No redundant fields
- Fixed-size fields where possible to avoid parsing overhead
- Variable-length fields (filename) kept optional, a future version could strip the filename entirely for maximum compactness

The total fixed overhead before the filename is **33 bytes** (4 magic + 1 version + 1 flags + 1 algorithm ID + 16 IV + 8 original size + 2 filename length). On a device with 2KB of RAM, 33 bytes of overhead is negligible.

---

## Key Management

The encryption is only as strong as how the key is handled.

EBIN supports two approaches:

---

### User Provided Key (PBKDF2)

The user provides a password. The password is never used directly as the AES key, it is run through a **Key Derivation Function (KDF)** called PBKDF2, which stretches it into a proper 128 or 256-bit key by hashing it thousands of times with a random value called a **salt**.

```c
ebin_derive_key(password, salt, output_key);
ebin_store("file.ebin", data, data_len, output_key);
```

The salt is stored in the `.ebin` header, it is not secret, it just ensures two identical passwords produce different keys. The password itself is never stored anywhere on the device.

| Pros | Cons |
|---|---|
| No extra hardware needed | User must remember the password |
| Pure C implementation | Weak passwords = weak keys |
| Salt stored in header, nothing else persists | Password entry awkward on devices with no input |
| Well understood, well documented | |

---

### Host-Based Key Management (Session Key over USB/Serial)

The key never lives on the device at all. It is stored on a laptop or server and sent to the device over USB or UART at the start of each session. The key lives only in RAM - the moment the device loses power, the key is gone.

```
Laptop (holds the key)
        |
        | sends key over USB / UART
        |
   ESP32 / Pico
        |
        | key lives in RAM only
        | used to encrypt/decrypt .ebin files
        | power off → key gone instantly
```

A one-time check, where the device receives the key once and then stores it to avoid asking again - defeats the purpose entirely. The moment the key is written to flash it can be extracted. The inconvenience of requiring the laptop each boot is the security feature, not a bug.

**Session-based** is the right middle ground, the key is sent once per power cycle, lives only in RAM, and is automatically destroyed on reset. No persistent key storage on the device at any point.

| Pros | Cons |
|---|---|
| Key never touches flash storage | Requires laptop/server present at each boot |
| Stolen device alone is useless | Key lost if device unexpectedly resets |
| Key automatically destroyed on power loss | Transmission channel must be secured |
| Strong even against physical attacks | More complex to implement |

- Device stolen without laptop → encrypted files, no key → safe
- Laptop stolen without device → key, no encrypted files → safe
- Both stolen → attacker has everything → requires an additional factor

---

### Comparison

| | User Key (PBKDF2) | Host Key (Session) |
|---|---|---|
| Key stored on device? | Never | Never (RAM only) |
| Requires external hardware? | No | Yes (laptop/server) |
| Survives power loss? | Yes (password re-entered) | No (key must be resent) |
| Implementation complexity | Low | Medium |
| Best for | Standalone devices | High security deployments |