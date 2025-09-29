# Space Invaders Using FFT

This makes 2 analog signals using web audio API.

1 signal controls the invaders  
1 signal controls the player

5 rows of invaders (11 invaders per row) = 55 invaders total move left to right across our game board  
each invader is assigned a frequency evenly spaced between 2000 and 22000mhz  
fft analysis is used to detect peaks in the signal

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Serve locally
npm run serve
```

## Deployment

This project is automatically deployed to GitHub Pages using GitHub Actions whenever you push to the main branch.

### Setup Instructions:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository settings on GitHub
   - Scroll down to "Pages" section
   - Under "Source", select "GitHub Actions"
   
3. **The deployment will automatically trigger** when you push to main branch

Your site will be available at: `https://yourusername.github.io/recurseCenter/`

## How it Works

- GitHub Actions automatically builds the TypeScript on every push
- The compiled JavaScript files are placed in the `dist/` directory
- The entire project (including compiled JS) is deployed to GitHub Pages
- No manual compilation needed - just push your TypeScript changes!
when a peak is detected, the corresponding invader is drawn on screen.

The player is controlled by a single frequency that moves up and down the frequency spectrum. <br/> 
FFT analysis is used to detect the peak in the signal
The signal's peak indicates the player's position on screen. <br/>
Right and left arrows or h and l keys increase and decrease the frequency, which moves the player left and right on screen 

a debugger is available by pressing the d key
the debugger shows a grid representing the game board to test hitting specific invaders
the debugger also shows the frequency and bin number for each invader and the player