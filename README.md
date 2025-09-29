## Space Invaders Using FFT

This makes 2 analog signals using web audio API.

1 signal controls the invaders
<br>1 signal controls the player

5 rows of invaders (11 invaders per row) = 55 invaders total move left to right across our game board <br/>
each invader is assigned a frequency evenly spaced between 2000 and 22000mhz
fft analysis is used to detect peaks in the signal
when a peak is detected, the corresponding invader is drawn on screen.

The player is controlled by a single frequency that moves up and down the frequency spectrum. <br/> 
FFT analysis is used to detect the peak in the signal
The signal's peak indicates the player's position on screen. <br/>
Right and left arrows or h and l keys increase and decrease the frequency, which moves the player left and right on screen 

a debugger is available by pressing the d key
the debugger shows a grid representing the game board to test hitting specific invaders
the debugger also shows the frequency and bin number for each invader and the player