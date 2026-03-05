---
layout: default
title: ASMR-Compiler
description: A HackNotts'25 submission
---
# asmr-compiler

#### COLLABORATORS
[@Alfred-Jijo](https://github.com/Alfred-Jijo)

[@GarethSimmans](https://github.com/GarethSimmans)

[@AlxFG](https://github.com/AlxFG)

[@samtowler](https://github.com/samtowler)

---
> [!IMPORTANT]
> Current implementation of this Language is neither complete or a compiler.

## Language

### Description
`asmr` lang is a assembly inspired language that outputs audio depending on the current operation it is executing
and is a submission for HackNotts '25.

### Types
```asmr
byte
```
#### Assignment
```asmr
ldv byte [variable] [var|number]
```
### Control Flow
```asmr
gcm[e|l|g] [condition]
    [operation]
alt
    [operation]
end
```
### Operators
```asmr
plus dest [var|num] [var|num]
sulp dest [var|num] [var|num]
dmp stream [var|num]
udp stream [var|num]
```
### Loops
```asmr
spin
    [conditional]
        crash
flight
```

loops in asmr are infinite by default, you must specify a base case to exit and use the crash keyword to break out of the loop
flight is used to denote the end of the loop sematically

> [!NOTE]
> `stream` for the `dump` and `undump` operations are like `C`:
>     - `stdin` and `stdout` or `file`