---
layout: default
title: Synthesthsia
description: An embedded music visualizer
---

# Synthesthsia

## About
Synthesthsia is a music visualizer project designed to be as cheap and accessible as possible to recreate. The primary objective is to write highly optimized code that requires the smallest possible amount of space and minimizes outside dependencies.

Currently, the project focuses on a 1D line visualizer mapping audio to an LED strip, with future goals to support 2D matrix grids and 3D peak terrain generation.

## Features
* **Real-Time Frequency Analysis**: Analyzes incoming audio across 7 distinct frequency bands.
* **Dynamic LED Mapping**: Uses a sine curve calculation to map volume inputs smoothly to the number of lit LEDs per segment.
* **Adaptive Brightness**: Features a dynamic volume ceiling that slowly lowers over time to adapt to quieter songs.
* **Color Segmentation**: Automatically generates and updates randomized colors for different LED segments at set intervals.

## Hardware Requirements
To prototype and run this project, you will need the following hardware:
* Arduino Uno R3.
* Microphone and an Audio Analyzer module.
* WS2812B Neopixel LEDs.

## Software Dependencies
This project is built using PlatformIO. The required libraries are managed through the `platformio.ini` environment configuration:
* FastLED.
* MSGEQ7 / MD_MSGEQ7.
* Adafruit NeoPixel.

## Project Structure
The repository is organized to separate core application logic from platform-specific code and documentation:

* `build/` - Build artifacts, binaries, and test outputs.
* `core/` - Core application logic, including FFT and audio processing.
* `docs/` - Documentation, including developer logs tracking the project's journey.
* `include/` - Header files and vendor includes.
* `lib/` - External libraries and dependencies.
* `platform/` - Platform-specific output and hardware configurations.
* `src/` - Main source code files (e.g., `main.cpp`).
* `tests/` - Testing framework and cases.

## Versioning
This project follows semantic versioning in the format `MAJOR.MINOR.PATCH+info` (where `info` can denote specific platforms or builds).

## Contributors
* [Alfred Jijo](https://gitlab.com/Alfred-Jijo)
* [Julian Knick](https://gitlab.com/jknick)