// TYPES
interface TSetup {
    audioContext: AudioContext;
    analyzer: AnalyserNode;
    gainNode: GainNode;
};

type TGameBoard = boolean[][];

interface TBracketFrequencyRange {
    min: number;
    max: number;
}
interface TPaintInvadersParams {
  audioCtx: AudioContext;
  bracketFrequencyRanges: TBracketFrequencyRange[];
  duration: number;
  gainNode: GainNode;
  gameBoard: TGameBoard;
  time: number;
}

type TPaintInvaders = (params: TPaintInvadersParams) => void;
type TGeneratePlayerFrequency = (params: Omit<TPaintInvadersParams, 'gameBoard'>) => void;

interface TPaintPlayerPosition {
    fftData: number[];
}

interface TMakeGameBoardParams {
    fftData: number[];
    gameBoard: TGameBoard;
    yOffset: number;
    svgId: number;
    xOffset: number;
}

interface TMakeRowOfInvadersParams {
    binEndIndex: number;
    binStartIndex: number;
    binsPerRow: number;
    fftData: number[];
    rowIndex: number;
    yOffset: number;
    xOffset: number;
    svgId: number;
    maxFFTValue: number;
    minFFTValue: number;
}

// constants
const initialBracketFrequencyRanges: TBracketFrequencyRange[] = [
    { min: 2200, max: 5800},
    { min: 6200, max: 9800 },
    { min: 10200, max: 13800 },
    { min: 14200, max: 17800 },
    { min: 18200, max: 21800 },
];

enum PLAY_STATE {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
};

enum PLAY_STATE_LABEL {
  CONTINUE = 'Continue Game',
  PAUSE = 'Pause Game',
  START = 'Start Game',
}

enum DIRECTION {
    LEFT = 'left',
    RIGHT = 'right',
}

enum ID {
  FPS = 'fps',
  STATE_BUTTON = 'stateButton'
}

const FFT_CONFIG = {
    fftSize: 1024,
    peakCount: 55,
    rowCount: 5,
    sampleRate: 44100,
}; 

enum SETTINGS {
    GAIN_VALUE = 0.1,
    INTERVAL = 100,
    OSCILLATOR_DURATION = 0.1,
    PIXEL_WIDTH = 800,
    ROWS = 5,
    ROW_HEIGHT = 100,
    SAMPLE_RATE = 44100,
    TIME_OFFSET_PER_OSCILLATOR = 0.001,
};

const bracketFrequencyRanges = [...initialBracketFrequencyRanges];
const mhzValues = new Array(5).fill(new Array(11).fill(0));
let animationId: number;
let currentGame: TSetup | null = null;
let debuggerOn: boolean = false;
let direction: DIRECTION = DIRECTION.RIGHT;
let fftData: Uint8Array<ArrayBuffer>;
let playerFftData: Uint8Array<ArrayBuffer>;
let playerFrequency: number = 10000;
let gameBoard = new Array(5).fill(new Array(11).fill(true)) as TGameBoard;
let gameStarted: boolean = false;
let lastFFTData: string = '';
let lastPlayerFFTData: string = '';
let lastTimeOscillator = 0;
let player: TSetup | null = null;
let playerPosition: number = SETTINGS.PIXEL_WIDTH / 2;
let playerViewportX: number = 0;
let playing: boolean;
let svgId: number = 0;
let playerSvgId: number = 0;
let xOffset: number = 0;
let yOffset: number = 0;

const setup = (): TSetup => {
    const audioContext: AudioContext = new AudioContext();
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = FFT_CONFIG.fftSize;
    const gainNode: GainNode = audioContext.createGain();
    gainNode.gain.value = SETTINGS.GAIN_VALUE;
    gainNode.connect(audioContext.destination);
    return {
        audioContext,
        analyzer,
        gainNode,
    };
};

const startGame = (): void => {
    gameStarted = true;
    const stateButton = window.document.getElementById(ID.STATE_BUTTON);
    stateButton.textContent = PLAY_STATE_LABEL.PAUSE;
    currentGame = setup();
    player = setup();
    animate();
    updateControllerGrid(gameBoard);
    connectAnalyzer('gameBoard');
    connectAnalyzer('player');
    playing = !playing;
};

const generatePlayerFrequency: TGeneratePlayerFrequency = ({
  audioCtx, 
  bracketFrequencyRanges,
  duration, 
  gainNode, 
  time, 
}) => {
    const sineWave = createSineWave(audioCtx); // same basic wave as main game
    const minFrequency = bracketFrequencyRanges[0].min; // game board top left 
    const maxFrequency = bracketFrequencyRanges[bracketFrequencyRanges.length - 1].max; // game board bottom right
    const percentageAcross = playerPosition / SETTINGS.PIXEL_WIDTH;
    // based on min and max frequency for whole game board, calculate frequency based on player position
    const frequencyRange = maxFrequency - minFrequency;
    playerFrequency = Math.round(minFrequency + (percentageAcross * frequencyRange));
    
    const osc = audioCtx.createOscillator();
    osc.frequency.setValueAtTime(playerFrequency, time);
    osc.setPeriodicWave(sineWave);
    const peakGain = audioCtx.createGain();
    peakGain.gain.setValueAtTime(SETTINGS.GAIN_VALUE*4, time); // Lower individual gain
    
    osc.connect(peakGain);
    peakGain.connect(gainNode);
    osc.start(time);
    osc.stop(time + duration);
};
const playTones: TPaintInvaders = ({
  audioCtx, 
  bracketFrequencyRanges,
  duration, 
  gainNode, 
  gameBoard,
  time, 
}) => {
    const sineWave = createSineWave(audioCtx); // most basic sine wave possible
    
    let timeOffset = 0; // slight offset to avoid all oscillators starting at the exact same time

    gameBoard.forEach((row, rowIndex) => { // iterate over each row in the game board

      const frequencies = generateRowOfInvaders(bracketFrequencyRanges[rowIndex]); // make 11 frequencies for this row based on its frequency range
      mhzValues[rowIndex] = [...frequencies]; // store these frequencies for debugging display

      row.forEach((isActive, index) => { // iterate over each cell in the row

        if (isActive && index < frequencies.length) { // only create oscillator if the alien in that cell has not been "hit" 

            const frequency = frequencies[index]; // get the frequency for this specific cell
            
            const osc = audioCtx.createOscillator();
            osc.frequency.setValueAtTime(frequency, time);
            osc.setPeriodicWave(sineWave);
            
            // Individual gain control for this peak
            const peakGain = audioCtx.createGain();
            peakGain.gain.setValueAtTime(SETTINGS.GAIN_VALUE, time); // Lower individual gain
            
            osc.connect(peakGain);
            peakGain.connect(gainNode);
            timeOffset += SETTINGS.TIME_OFFSET_PER_OSCILLATOR;
            osc.start(time + timeOffset);
            osc.stop(time + timeOffset + duration);
        }
      });
    });
};

export const makeRowOfInvaders = ({
    binEndIndex,
    binStartIndex,
    binsPerRow,
    fftData,
    rowIndex,
    yOffset,
    xOffset,
    svgId,
    maxFFTValue,
    minFFTValue,
}: TMakeRowOfInvadersParams): void => {
    // create group for this row so it can be easily removed on the next frame
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const className = `peak-${svgId}-row-${rowIndex}`;
    group.setAttribute("class", className);
    const topOfLine = `${yOffset + (rowIndex * 100) + (minFFTValue + 60)/2}`;
    let path = `M ${100} ${topOfLine}`; // Starting point
    let x = 100 + xOffset;
    const stepWidth = Number((SETTINGS.PIXEL_WIDTH / binsPerRow).toFixed(2));

    // Remove old peaks
    const allPeaks = document.getElementsByClassName(`peak-${svgId-1}-row-${rowIndex}`);
    while(allPeaks[0]) {
        allPeaks[0].parentNode?.removeChild(allPeaks[0]);
    }

    // Draw the invaders 
    let lastPeakDetected: number;
    let peakNumber = 0;
    for(let i = binStartIndex; i < binEndIndex; i++) {
        // is this bin a peak?
        const diffFromMax = Math.abs(maxFFTValue - fftData[i+2]);
        x += stepWidth;
        const y = (yOffset + (rowIndex * SETTINGS.ROW_HEIGHT)) + (fftData[i+2] / 2);
        path = `${path} L${x.toFixed(2)} ${y.toFixed(2)}`;
        // is this peak too close to the last invader?
        const spacedEnough = !lastPeakDetected || Math.abs(x - lastPeakDetected) > 25;
        if(diffFromMax < 40 && spacedEnough && mhzValues[rowIndex][peakNumber]){
            lastPeakDetected = x;
            makeInvader(Number(x.toFixed(2)), yOffset + (rowIndex * SETTINGS.ROW_HEIGHT), className, group, {
                row: rowIndex,
                column: peakNumber,
            });
            if(debuggerOn) addTextToSVGGroup(group, `bin ${i}`, Number(x.toFixed(2))-10, yOffset + (rowIndex * SETTINGS.ROW_HEIGHT)+70);
            if(debuggerOn) addTextToSVGGroup(group, `${mhzValues[rowIndex][peakNumber]}mhz`, Number(x.toFixed(2))-10, yOffset + (rowIndex * SETTINGS.ROW_HEIGHT)+85);
            peakNumber++;
        }
    }
    x += stepWidth;
    path = `${path} L${x.toFixed(2)} ${topOfLine}`;

    group.setAttribute("id", `group-${svgId}-row-${rowIndex}`);
    document.getElementById("gameBoard")?.appendChild(group);
};

const paintPlayerPosition = ({ fftData }: TPaintPlayerPosition): void => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const className = `player-${playerSvgId}`;
    group.setAttribute("class", className);
    const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let path = `M 0 ${SETTINGS.PIXEL_WIDTH}`; // Starting point
    let x = 0;
    const stepWidth = Number((SETTINGS.PIXEL_WIDTH / fftData.length).toFixed(2));
    const previousPlayer = document.getElementsByClassName(`player-${playerSvgId-1}`);
    while(previousPlayer[0]) {
        previousPlayer[0].parentNode?.removeChild(previousPlayer[0]);
    }
    const maxFFTValue = Math.max(...fftData);
    let peakY: number = maxFFTValue / 2;
    let peakX: number = 0;
    for (let i = 0; i < fftData.length; i++) {
        x += stepWidth;
        const y = (SETTINGS.PIXEL_WIDTH) - (fftData[i] / 2);
        path = `${path} L${x.toFixed(2)} ${y.toFixed(2)}`;

        if (fftData[i] === maxFFTValue) {
            // make circle so that we can find the player position in the viewport
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', `${x.toFixed(2)}`); 
            circle.setAttribute('cy', `${y.toFixed(2)}`); 
            circle.setAttribute('r', '2.5'); 
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', 'none');
            circle.setAttribute('id', 'player-position');
            group.appendChild(circle);
            peakX = Number(x.toFixed(2)) - 10;
            peakY = y;
            if (debuggerOn) addTextToSVGGroup(group, `player ${playerFrequency}mhz`, peakX, y - 10);
            if (debuggerOn) addTextToSVGGroup(group, `bin ${i}`, peakX, y + 5);
        }
    }
    newPath.setAttribute("d", path);
    newPath.setAttribute("stroke", "white");
    newPath.setAttribute("stroke-width", "0.5");
    group.appendChild(newPath);
    group.style.transform = 'translateX(-200px) scaleX(1.5)';
    document.getElementById("gameBoard")?.appendChild(group);
    const playerPosition = document.getElementById('player-position');
    const playerPositionRect = playerPosition?.getBoundingClientRect();
    const { x: currentPlayerViewportX } = playerPositionRect!;
    console.log('playerPositionRect', playerPositionRect);
    playerViewportX = currentPlayerViewportX;
    if (debuggerOn) addTextToSVGGroup(group, `viewport position: ${playerViewportX.toFixed(2)}`, peakX, peakY + 15);
};
const makeGameBoard = ({
    fftData, 
    gameBoard,
    svgId,
    yOffset,
    xOffset,
}: TMakeGameBoardParams): void => {
    const startValue = Math.ceil(fftData.length * 0.08);
    const endValue = fftData.length - startValue;
    const binsPerRow = Math.floor((endValue - startValue) / gameBoard.length);
    const maxFFTValue = Math.max(...fftData);
    const minFFTValue = Math.min(...fftData);
    for(let i = 0; i < gameBoard.length; i++) {
        makeRowOfInvaders({ 
            yOffset,
            xOffset,
            svgId,
            binEndIndex: (i + 1) * binsPerRow + startValue,
            binStartIndex: (i * binsPerRow) + startValue,
            binsPerRow,
            fftData,
            rowIndex: i,
            maxFFTValue,
            minFFTValue,
        });
    }
};

function step(): void {
    if(!currentGame) return;
    const { analyzer, audioContext, gainNode } = currentGame;
    const { 
        analyzer: playerAnalyzer, 
        audioContext: playerAudioContext, 
        gainNode: playerGainNode,
    } = player;

    const currentTime = performance.now();
    const runSweep = currentTime - lastTimeOscillator >= SETTINGS.INTERVAL;
    moveInvaders();
    movePlayer();
    if (runSweep) {
        lastTimeOscillator = currentTime;
        // connect oscillators and play frequencies based on active elements in gameBoard
        playTones({
            audioCtx: audioContext, 
            bracketFrequencyRanges,
            duration: SETTINGS.OSCILLATOR_DURATION,
            gainNode,
            gameBoard,
            time: audioContext.currentTime,
        });
        generatePlayerFrequency({
            audioCtx: playerAudioContext, 
            bracketFrequencyRanges,
            duration: SETTINGS.OSCILLATOR_DURATION,
            gainNode: playerGainNode,
            time: playerAudioContext.currentTime,
        });
    }
    analyzer.getByteFrequencyData(fftData);
    playerAnalyzer.getByteFrequencyData(playerFftData);
    if(JSON.stringify([...fftData]) !== lastFFTData) {
        yOffset += 0.005;
        svgId += 1;
        makeGameBoard({
            fftData: [...fftData],
            gameBoard,
            yOffset,
            svgId,
            xOffset,
        });
    }
    if(JSON.stringify([...playerFftData]) !== lastPlayerFFTData) {
        playerSvgId += 1;
        console.log('playerFrequency', playerFrequency);
        paintPlayerPosition({ 
            fftData: [...playerFftData],
        });
    }
    lastFFTData = JSON.stringify([...fftData]);
    lastPlayerFFTData = JSON.stringify([...playerFftData]);
    animationId = requestAnimationFrame(step);
};

function moveInvaders(): void {
    const multiplier = gameBoard.flat().filter(e => !e).length + 1;
    const increments = multiplier * 0.08;
    xOffset += (direction === "right" ? increments : -increments);
    for (let i = 0; i < gameBoard.length; i++) {
        const svgGroup = document.getElementById(`group-${svgId}-row-${i}`);
        if(!svgGroup) continue;
        const { left, right } = svgGroup.getBoundingClientRect();
        if(right >= 680){
            direction = DIRECTION.LEFT;
        }
        if(left <= 20){
            direction = DIRECTION.RIGHT;
        }
    }
};

function movePlayer(): void {
};

function generateRowOfInvaders(bracketFrequencyRanges: { min: number; max: number }): number[] {
  const { min, max } = bracketFrequencyRanges;
  const { peakCount: totalPeaks, rowCount} = FFT_CONFIG;
  const peakCount = totalPeaks / rowCount;

  const range = max - min;
  const linearSpacing = range / (peakCount - 1);

  return Array.from({ length: peakCount }, (_, i) => 
    Math.round(min + (i * linearSpacing))
  );
}

function makeInvader(x: number, y: number, className: string, group: SVGGElement, { row, column }: { row: number; column: number }): void {
    const invaderPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    invaderPath.setAttribute("d", "M469.344,266.664v-85.328h-42.656v-42.672H384v-21.328h42.688v-64h-64v42.656H320v42.672H192V95.992  h-42.656V53.336h-64v64H128v21.328H85.344v42.672H42.688v85.328H0v149.328h64v-85.328h21.344v85.328H128v42.672h106.688v-64h-85.344  v-21.328h213.344v21.328h-85.344v64H384v-42.672h42.688v-85.328H448v85.328h64V266.664H469.344z M192,245.336h-64v-64h64V245.336z   M384,245.336h-64v-64h64V245.336z");
    invaderPath.setAttribute("fill", "white");
    invaderPath.setAttribute("class", className);
    const originalWidth = 512;
    const targetWidth = 50;
    const scale = targetWidth / originalWidth;

    const innerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    innerGroup.setAttribute("transform", `translate(${x-10}, ${y}) scale(${scale})`);
    innerGroup.setAttribute("class", className);
    innerGroup.setAttribute("id", `invader-row-${row}-column-${column}`);
    innerGroup.appendChild(invaderPath);

    group.appendChild(innerGroup);
};

function createSineWave(audioContext: AudioContext): PeriodicWave {
    // sine wave with only first harmonic
    const real = new Float32Array(2);
    const imag = new Float32Array(2);
    
    real[0] = 0; // Waveform never changes
    real[1] = 1; // Cosine value
    imag[0] = 0; // Waveform never changes
    imag[1] = 1; // Sine value
    
    return audioContext.createPeriodicWave(real, imag);
}

function connectAnalyzer(context: "gameBoard" | "player"): void {
    const currentContext = context === "gameBoard" ? currentGame : player;
    const { analyzer, audioContext, gainNode } = currentContext!;
    gainNode.disconnect();
    gainNode.connect(analyzer);
    analyzer.connect(audioContext.destination);
    if(context === "gameBoard"){
        fftData = new Uint8Array(analyzer.frequencyBinCount);
    }else{
        playerFftData = new Uint8Array(analyzer.frequencyBinCount);
    }
};

function animate(): void { // main animation loop
    animationId = requestAnimationFrame(step);
}

// update button label based on current state
function currentStateLabel(): PLAY_STATE {
    let label = window.document.getElementById(ID.STATE_BUTTON)!.textContent as PLAY_STATE_LABEL;
    switch (label) {
        case PLAY_STATE_LABEL.PAUSE:
            return PLAY_STATE.PLAYING;
        case PLAY_STATE_LABEL.CONTINUE:
            return PLAY_STATE.PAUSED;
        case PLAY_STATE_LABEL.START:
            return PLAY_STATE.STOPPED;
    };
};

// button event listener
document.getElementById(ID.STATE_BUTTON)?.addEventListener("click", () => {
    const currentState = currentStateLabel();
    if(currentState === PLAY_STATE.STOPPED) {
        startGame();
    }
    if(currentState === PLAY_STATE.PAUSED && gameStarted) {
        document.getElementById(ID.STATE_BUTTON)!.textContent = PLAY_STATE_LABEL.PAUSE;
        playing = !playing;
        animationId = requestAnimationFrame(step);
    }
    if(currentState === PLAY_STATE.PLAYING && gameStarted) {
        document.getElementById(ID.STATE_BUTTON)!.textContent = PLAY_STATE_LABEL.CONTINUE;
        if(animationId) cancelAnimationFrame(animationId); 
        playing = !playing;
    }
});

// DEBUGGER
const gridContainer = document.getElementById("controller-grid");

gridContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.id.startsWith("cell-")) return;

    const [, rowStr, colStr] = target.id.split("-");
    const rowIndex = Number(rowStr);
    const colIndex = Number(colStr);
    if (isNaN(rowIndex) || isNaN(colIndex)) return;

    const currentRow = [...gameBoard[rowIndex]];
    currentRow[colIndex] = !currentRow[colIndex];
    gameBoard[rowIndex] = currentRow;
    // Toggle background color
    if (target.style.backgroundColor === "green") {
        target.style.backgroundColor = "white";
    } else {
        target.style.backgroundColor = "green";
    }
});

function updateControllerGrid (gameboard: TGameBoard): void {
    const gridContainer = document.getElementById("controller-grid");
    if (!gridContainer) return;

    gridContainer.innerHTML = ""; // Clear previous cells

    gameboard.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement("div");
            cellDiv.style.gridRow = (rowIndex + 1).toString();
            cellDiv.style.gridColumn = (colIndex + 1).toString();
            cellDiv.style.width = "40px";
            cellDiv.style.height = "40px";
            cellDiv.style.border = "1px solid #ccc";
            cellDiv.style.boxSizing = "border-box";
            cellDiv.setAttribute("id", `cell-${rowIndex}-${colIndex}`);
            if (cell) {
                cellDiv.style.backgroundColor = "green";
                cellDiv.style.cursor = "pointer";
            } else {
                cellDiv.style.backgroundColor = "transparent";
                cellDiv.style.cursor = "default";
            }
            gridContainer.appendChild(cellDiv);
        });
    });
};

function addTextToSVGGroup ( group: SVGGElement, text: string, x: number, y: number): void {
    const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textElem.setAttribute("x", x.toString());
    textElem.setAttribute("y", y.toString());
    textElem.textContent = text;
    textElem.setAttribute("fill", "white");
    textElem.setAttribute("font-size", "16");
    group.appendChild(textElem);
};

document.addEventListener('keydown', (event) => {
  if (event.key === 'd') {
    debuggerOn = !debuggerOn;
    const gridContainer = document.getElementById("controller-grid");
    if(debuggerOn) {
        gridContainer.style.visibility = "visible";
    }else{
        gridContainer.style.visibility = "hidden";
    }
  }
  if( event.key === 'l' || event.key === 'ArrowRight') {
    if(playerPosition >= SETTINGS.PIXEL_WIDTH) return;
    playerPosition += 10;
  }
  if( event.key === 'h' || event.key === 'ArrowLeft') {
    if(playerPosition <= 0) return;
    playerPosition -= 10;
  }
  if( event.key === 'Enter') {
    const currentState = currentStateLabel();
    if(currentState === PLAY_STATE.STOPPED) {
        startGame();
    }
  }
});