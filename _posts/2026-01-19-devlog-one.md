Looking through different libraries, `miniaudio`, `stb_voirbis`, even `SDL`, its obvious that these are all designed at an OS level.\
So having to flash these to a microcontroller is going to be a PITA, or we do the math: `audio "deciphering"` and `FFT` on a computer (OS-level).\
Then we send the `FFT` data via USB to the microcontroller and have it do its thing from there.

As great as that is having a standalone MCU doing its thing, is better IMO.\
So after some reasearch, the Microcontrollers that allow the:
	* Storing
	* FFT-ing
	* Music Visulising
of audio files are: ...\

Fuck all.

Turns out we need `High-Performance Microcontroller`

To "Store, Play, Decode, Analyze, and Visualize" simultaneously, the chip needs:

1. **Storage Access:** Fast SD Card reading.
2. **Audio Output:** I2S (High quality digital audio) or DAC (Analog).
3. **DSP Power:** Hardware acceleration for FFT math (Digital Signal Processing).
4. **DMA (Direct Memory Access):** To push LED pixels without stopping the audio.

Here are two best options for a standalone device:

### Option A: Teensy 4.1

The **Teensy 4.1** is the king of audio microcontrollers. It runs at **600MHz** (an Arduino Uno is 16MHz) and has a built-in SD card slot.

1. **Store:** Put WAV files on a MicroSD card.
2. **Play:** Teensy reads SD -> Sends to I2S Amp (Speakers).
3. **FFT:** Teensy splits the signal internally -> Runs 1024-point FFT in hardware.
4. **Visualize:** You read the FFT bins -> Push to FastLED.


* **Libraries:** `Teensy Audio Library` + `FastLED`.
* **Cost:** ~$30 USD.

### Option B: ESP32 (Standard or S3)

The **ESP32** is a dual-core 240MHz chip. It is powerful enough to play MP3s and run FFTs if we are clever enough with multi-threading (run audio on Core 0, visuals on Core 1).

It has WiFi/Bluetooth, so we could stream music wirelessly or control it via a phone app.
1. **Store:** Connect an external SD Card module (SPI).
2. **Play:** Use `ESP32-audioI2S` library to decode MP3/WAV.
3. **FFT:** Use `arduinoFFT` library on the PCM data stream.
4. **Visualize:** Drive LEDs via the RMT peripheral (FastLED/NeoPixelBus).


* **Libraries:** `ESP32-audioI2S`, `arduinoFFT`.
* **Cost:** ~$5 - $8 USD.

So we can prototype real quick because these libs handle the FFT for us, then we can jsut make our own FFT that follow that libs api or we just change everything.