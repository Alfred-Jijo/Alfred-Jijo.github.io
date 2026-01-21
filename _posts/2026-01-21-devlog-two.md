Me and Julian started today, I finally brought in my Arduino and Julian brought in his bits and bobs.\
So we ended up with this code already made by Julian, in [here](.\docs\iterations\iter_one.cpp),\
so we thought we had a clear and cut prototype already ready, that we could modify and make a great start to Synthethsia.

>			Murphy's Law
> Anything that can go wrong, will go wrong

Turns out, the default Arduino Sound Library, doesnt support the Arduino Uno R3 as of yet. So it took us down a rabbit hole of great depth\
before we were able to figure out that, we needed to use the Sound Library provided by DFR Robotics for their Audio Analyzer V2.0.

Then we tried to debug via the Serial Monitor, and we got out utter garbage. After an hour of pluging wires into the same hole over and over again.
We realised that the `Reset` and `Strobe` pins of the Audio Analyzer wasnt connected, so after the obvious fix. We got cohert values.\
That consisted of 0's and only 0's, and as smart as we are, turns out we connected them in reverse.

So once again after the obvious fix, weve got a working "prototype" that you can see on Me and Julians.
<iframe src="https://www.linkedin.com/embed/feed/update/urn:li:share:7419761773999878144?collapsed=1" height="568" width="504" frameborder="0" allowfullscreen="" title="Embedded post"></iframe>