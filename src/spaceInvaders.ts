// TYPES
interface TSetup {
    audioContext: AudioContext;
    analyzer: AnalyserNode;
    gainNode: GainNode;
}

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

interface TPaintRowOfInvadersParams {
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
    { min: 2200, max: 5800}, // top row
    { min: 6200, max: 9800 },
    { min: 10200, max: 13800 },
    { min: 14200, max: 17800 },
    { min: 18200, max: 21800 }, // bottom row
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

enum SETTINGS {
    // INVADER SETTINGS
    INVADER_COLOR = 'white',
    INVADER_FFT_START_PERCENTAGE_OFFSET = 0.08,
    INVADER_LEFT_MOVEMENT_MIN = 20,
    INVADER_PEAK_DISPLACEMENT_THRESHOLD_X  = 25,
    INVADER_PEAK_DISPLACEMENT_THRESHOLD_Y  = 40,
    INVADER_RIGHT_MOVEMENT_MAX = 680,
    INVADER_ROW_HEIGHT = 100,
    INVADER_START_ROW_POSITION_X = 100,
    INVADER_WIDTH = 50,
    INVADER_X_MOVEMENT = 0.08,
    INVADER_Y_MOVEMENT = 0.05,
    // PLAYER SETTINGS
    PLAYER_GAIN_MULTIPLIER = 4,
    PLAYER_LINE_COLOR = 'white',
    PLAYER_LINE_WIDTH = 1,
    PLAYER_MARKER_RADIUS = 0.5,
    PLAYER_POSITION_ID = 'player-position',
    PLAYER_START_POSITION_X = 0,
    PLAYER_WIDTH_SCALE_X = 1.5,
    PLAYER_WIDTH_TRANSLATE_X = -200,
    PLAYER_X_MOVEMENT = 10,
    // GENERAL SETTINGS
    BUTTON_ID = 'stateButton',
    FFT_SIZE = 1024, // bin count is half this value
    GAIN_VALUE = 0.1, // effects how accurately peaks are detected
    INTERVAL = 100, // interval between oscillator sweeps in ms
    OSCILLATOR_DURATION = 0.1, // duration of each oscillator in seconds
    PEAK_COUNT = 55, // total number of invaders on game board
    PIXEL_WIDTH = 800, // game board width in pixels
    ROW_COUNT = 5, // number of rows of invaders
    TIME_OFFSET_PER_OSCILLATOR = 0, // offset each oscillator by this amount to avoid all starting at the same time
    // Laser settings
    LASER_DURATION = 500, // duration of laser firing in ms
};

enum DEBUGGER_SETTINGS {
    CONTROLLER_GRID_ID = 'controller-grid',
    CONTROLLER_CELL_COLOR_INACTIVE = 'none',
    CONTROLLER_CELL_COLOR_ACTIVE = 'none',
}

enum CONTROLS {
    RIGHT = 'ArrowRight',
    VIM_RIGHT = 'l',
    VIM_LEFT = 'h',
    LEFT = 'ArrowLeft',
    START = 'Enter',
}

enum ROLE {
    PLAYER = 'player',
    GAMEBOARD = 'gameBoard',
}

const bracketFrequencyRanges = [...initialBracketFrequencyRanges];
const gameBoard = new Array(SETTINGS.ROW_COUNT).fill(new Array(SETTINGS.PEAK_COUNT / SETTINGS.ROW_COUNT).fill(true)) as TGameBoard;
const invaderSVGPath = "M469.344,266.664v-85.328h-42.656v-42.672H384v-21.328h42.688v-64h-64v42.656H320v42.672H192V95.992  h-42.656V53.336h-64v64H128v21.328H85.344v42.672H42.688v85.328H0v149.328h64v-85.328h21.344v85.328H128v42.672h106.688v-64h-85.344  v-21.328h213.344v21.328h-85.344v64H384v-42.672h42.688v-85.328H448v85.328h64V266.664H469.344z M192,245.336h-64v-64h64V245.336z   M384,245.336h-64v-64h64V245.336z";
const mhzValues = new Array(SETTINGS.ROW_COUNT).fill(new Array(SETTINGS.PEAK_COUNT / SETTINGS.ROW_COUNT).fill(0)) as number[][];
const invaderXValues = new Array(SETTINGS.ROW_COUNT).fill(new Array(SETTINGS.PEAK_COUNT / SETTINGS.ROW_COUNT).fill(0)) as number[][];

let animationId: number;
let currentGame: TSetup | null = null;
let debuggerOn: boolean = false;
let direction: DIRECTION = DIRECTION.RIGHT;
let fftData: Uint8Array<ArrayBuffer>;
let playerFftData: Uint8Array<ArrayBuffer>;
// initial player frequency is middle of the whole game board range
let playerFrequency: number = (bracketFrequencyRanges[0].max - bracketFrequencyRanges[bracketFrequencyRanges.length - 1].min) / 2;
// initial game board with all invaders active
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
let invaderStepWidth = 0;
let beginFire = false;
let currentlyFiring = false;
let laserBeginTime: undefined | number = undefined;
let laserYOffset = 0;
let gameOver = false;
let playerY = 0;
let invaderHitRow: number | undefined = undefined;
let invaderHitColumn: number | undefined = undefined;
let invaderElement: Element | undefined = undefined;

const setup = (): TSetup => {
    const audioContext: AudioContext = new AudioContext();
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = SETTINGS.FFT_SIZE;
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
    const gridContainer = document.getElementById(DEBUGGER_SETTINGS.CONTROLLER_GRID_ID);
    gridContainer.style.visibility = "visible";
    gameStarted = true;
    const stateButton = window.document.getElementById(SETTINGS.BUTTON_ID);
    stateButton.textContent = PLAY_STATE_LABEL.PAUSE;

    // begin invaders signal chain
    currentGame = setup();
    // begin player signal chain
    player = setup();

    // begin animation loop
    animationId = requestAnimationFrame(step);
    // persist animation loop
    playing = true;

    // begin painting invaders
    connectAnalyzer(ROLE.GAMEBOARD);
    // begin painting player
    connectAnalyzer(ROLE.PLAYER);

    // set up debugger grid
    updateControllerGrid(gameBoard);
};

const endGame = (): void => {
    if(animationId) cancelAnimationFrame(animationId); 
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
    peakGain.gain.setValueAtTime(SETTINGS.GAIN_VALUE*SETTINGS.PLAYER_GAIN_MULTIPLIER, time); // make player louder than invaders
    
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
    
    const newJson = JSON.stringify(gameBoard);

    const gameOver = gameBoard.flat().every(cell => !cell);
    gameOver && endGame();

    gameBoard.forEach((row, rowIndex) => { // iterate over each row in the game board

      const frequencies = paintInvaderOnPeakFrequencies(bracketFrequencyRanges[rowIndex]); // make 11 frequencies for this row based on its frequency range
      mhzValues[rowIndex] = [...frequencies]; // store these frequencies for debugging display

      row.forEach((isActive, index) => { // iterate over each cell in the row

        if (isActive && index < frequencies.length) { // only create oscillator if the alien in that cell has not been "hit" 

            const frequency = frequencies[index]; // get the frequency for this specific cell
            
            const osc = audioCtx.createOscillator();
            osc.frequency.setValueAtTime(frequency, time);
            osc.setPeriodicWave(sineWave);
            
            // Individual gain control for this peak
            const peakGain = audioCtx.createGain();
            peakGain.gain.setValueAtTime(SETTINGS.GAIN_VALUE, time);
            
            osc.connect(peakGain);
            peakGain.connect(gainNode);
            osc.start(time);
            osc.stop(time + duration);
        }
      });
    });

};

export const paintRowOfInvaders = ({
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
}: TPaintRowOfInvadersParams): void => {
    // create group for this row so it can be easily removed on the next frame
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const className = `peak-${svgId}-row-${rowIndex}`;
    group.setAttribute("class", className);
    const topOfLine = `${yOffset + (rowIndex * SETTINGS.INVADER_ROW_HEIGHT) + (minFFTValue + 60)/2}`;
    let path = `M ${SETTINGS.INVADER_ROW_HEIGHT} ${topOfLine}`; // Starting point
    let x = SETTINGS.INVADER_START_ROW_POSITION_X + xOffset;
    const gridContainer = document.getElementById(DEBUGGER_SETTINGS.CONTROLLER_GRID_ID);
    gridContainer.style.transform = `translate(${xOffset * .585}px, ${yOffset * .585}px)`;
    invaderStepWidth = Number((SETTINGS.PIXEL_WIDTH / binsPerRow).toFixed(2));

    // Remove peaks from last animation frame before drawing new ones
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
        x += invaderStepWidth;
        const y = (yOffset + (rowIndex * SETTINGS.INVADER_ROW_HEIGHT)) + (fftData[i+2] / 2);
        path = `${path} L${x.toFixed(2)} ${y.toFixed(2)}`;

        // is this a peak
        const displacedOnYAxis = diffFromMax < SETTINGS.INVADER_PEAK_DISPLACEMENT_THRESHOLD_Y ;
        // is this peak too close to the last invader?
        const displacedOnXAxis = !lastPeakDetected || Math.abs(x - lastPeakDetected) > SETTINGS.INVADER_PEAK_DISPLACEMENT_THRESHOLD_X ;
        // is this a valid cell on the gameboard
        const correspondsToGameboard = gameBoard[rowIndex][peakNumber];

        // paint invader if a peak is detected and it is not too close to the last invader and if the gameboard cell exists
        if(displacedOnYAxis && displacedOnXAxis && correspondsToGameboard !== undefined){
            const isActive = gameBoard[rowIndex][peakNumber];
            lastPeakDetected = x;
            isActive && paintInvaderOnPeak(Number(x.toFixed(2)), yOffset + (rowIndex * SETTINGS.INVADER_ROW_HEIGHT), className, group, {
                row: rowIndex,
                column: peakNumber,
            });
            if(debuggerOn) addTextToSVGGroup(group, `bin ${i}`, Number(x.toFixed(2))-10, yOffset + (rowIndex * SETTINGS.INVADER_ROW_HEIGHT)+70);
            if(debuggerOn) addTextToSVGGroup(group, `${mhzValues[rowIndex][peakNumber]}mhz`, Number(x.toFixed(2))-10, yOffset + (rowIndex * SETTINGS.INVADER_ROW_HEIGHT)+85);
            if(debuggerOn) addTextToSVGGroup(group, `x: ${Number(x.toFixed(2))}`, Number(x.toFixed(2))-10, yOffset + (rowIndex * SETTINGS.INVADER_ROW_HEIGHT)+100);
            invaderXValues[rowIndex][peakNumber] = Number(x.toFixed(2));
            peakNumber++; // track gameboard cell index
        }
    }
    x += invaderStepWidth;
    path = `${path} L${x.toFixed(2)} ${topOfLine}`;
    if(debuggerOn){
        const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        newPath.setAttribute("d", path);
        newPath.setAttribute("stroke", "yellow");
        newPath.setAttribute("stroke-width", "1");
        newPath.setAttribute("fill", "none");
        group.appendChild(newPath);
    }

    group.setAttribute("id", `group-${svgId}-row-${rowIndex}`);
    document.getElementById("gameBoard")?.appendChild(group);
};

function getElementsFromPoint(x: number, y: number): void | { row: number; column: number } {
    const elements = document.elementsFromPoint(x, y);
    // console.log('elements from point', elements);
    const cellsInColumn: Element[] = [];
    for (const element of elements) {
        if(element.getAttribute('id')?.startsWith('cell-')){
            cellsInColumn.push(element);
            const [ , rowString, columnString ] = element.getAttribute('id')!.split('-');
            const row = Number(rowString);
            const column = Number(columnString);
            return {
                row,
                column
            }
        }
    }
}

const addTextToDiv = (text: string, container: HTMLElement): void => {
    const previousText = container.getElementsByClassName("hit-text");
    while(previousText[0]) {
        previousText[0].parentNode?.removeChild(previousText[0]);
    }
    const div = document.createElement("div");
    div.setAttribute("class", "hit-text");
    div.textContent = text;
    container.appendChild(div);
};

function lookAtAllOfThePaths(x: number){
    const numbers = new Array(20).fill(0).map((_, i) => {
        return SETTINGS.PIXEL_WIDTH - (i * 50);
    });
    for (const number of numbers) {
        const elements = getElementsFromPoint(x, number);
        if(elements !== undefined){
            const { column } = elements as { row: number; column: number };
            for ( let i = gameBoard.length - 1; i >= 0; i--) {
                if(gameBoard[i][column] === true){
                    if(invaderHitColumn === undefined && invaderHitRow === undefined){
                        invaderElement = document.getElementById(`invader-row-${i}-column-${column}`);
                        invaderHitRow = i;
                        invaderHitColumn = column;
                    }
                }
            }
        }
    }
}

function removeInvader(){
    try {
        if (invaderElement !== undefined || invaderElement !== null) {
            addTextToDiv(`Hit! row ${invaderHitRow + 1} column ${invaderHitColumn + 1}`, document.getElementById("hit-dialog")!);

            const newRow = [...gameBoard[invaderHitRow]];
            newRow[invaderHitColumn] = false;
            gameBoard[invaderHitRow] = newRow;
            currentlyFiring = false;
            laserBeginTime = undefined;
            laserYOffset = 0;
            invaderHitRow = undefined;
            invaderHitColumn = undefined;
            invaderElement.parentNode?.removeChild(invaderElement);
            invaderElement = undefined;
        }
    } catch (e) {
        console.log(e);
    }
}
const paintPlayerPosition = ({ fftData }: TPaintPlayerPosition): void => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const className = `player-${playerSvgId}`;
    group.setAttribute("class", className);
    const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let path = `M ${SETTINGS.PLAYER_START_POSITION_X} ${SETTINGS.PIXEL_WIDTH}`; // Starting point
    let x = 0;
    const playerStepWidth = Number((SETTINGS.PIXEL_WIDTH / fftData.length).toFixed(2));
    const previousPlayer = document.getElementsByClassName(`player-${playerSvgId-1}`);
    while(previousPlayer[0]) {
        previousPlayer[0].parentNode?.removeChild(previousPlayer[0]);
    }
    const maxFFTValue = Math.max(...fftData);
    let peakY: number = maxFFTValue / 2;
    let peakX: number = 0;
    for (let i = 0; i < fftData.length; i++) {
        x += playerStepWidth;
        const y = (SETTINGS.PIXEL_WIDTH) - (fftData[i] / 2);
        path = `${path} L${x.toFixed(2)} ${y.toFixed(2)}`;

        if (fftData[i] === maxFFTValue) {
            if(currentlyFiring && beginFire){
                beginFire = false;
            }
            if(laserBeginTime !== undefined){
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                const laserTop = Number(y.toFixed(2)) - 100 - laserYOffset;
                const laserBottom = Number(y.toFixed(2)) - laserYOffset;
                lookAtAllOfThePaths(x-50);
                if(invaderHitColumn !== undefined && invaderHitRow !== undefined){
                    console.log({ invaderHitRow, invaderHitColumn });
                    const currentTime = performance.now();
                    const laserTimeElapsed = currentTime - laserBeginTime >= Number((SETTINGS.LASER_DURATION / (invaderHitRow+1)));
                    if (laserTimeElapsed) {
                        removeInvader();
                    } else {
                        line.setAttribute("x1", `${x.toFixed(2)}`);
                        line.setAttribute("y1", `${laserBottom}`);
                        line.setAttribute("x2", `${x.toFixed(2)}`);
                        line.setAttribute("y2", `${laserTop}`);
                        line.setAttribute("stroke", "red");
                        line.setAttribute("stroke-width", "10");
                        group.appendChild(line);
                    }
                    // updateControllerGrid([...gameBoard]);
                }else{
                    line.setAttribute("x1", `${x.toFixed(2)}`);
                    line.setAttribute("y1", `${laserBottom}`);
                    line.setAttribute("x2", `${x.toFixed(2)}`);
                    line.setAttribute("y2", `${laserTop}`);
                    line.setAttribute("stroke", "red");
                    line.setAttribute("stroke-width", "10");
                    group.appendChild(line);
                }
            }
            // create marker so that we can find the player position in the viewport
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', `${x.toFixed(2)}`); 
            circle.setAttribute('cy', `${y.toFixed(2)}`); 
            circle.setAttribute('r', `${SETTINGS.PLAYER_MARKER_RADIUS}`); 
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', 'none');
            circle.setAttribute('id', SETTINGS.PLAYER_POSITION_ID);
            group.appendChild(circle);
            peakX = Number(x.toFixed(2));
            peakY = y;
            playerY = y;
            if (debuggerOn) addTextToSVGGroup(group, `x position ${peakX}`, peakX, y - 25);
            if (debuggerOn) addTextToSVGGroup(group, `player ${playerFrequency}mhz`, peakX, y - 10);
            if (debuggerOn) addTextToSVGGroup(group, `bin ${i}`, peakX, y + 5);
        }
    }
    newPath.setAttribute("d", path);
    newPath.setAttribute("stroke", SETTINGS.PLAYER_LINE_COLOR);
    newPath.setAttribute("stroke-width", SETTINGS.PLAYER_LINE_WIDTH.toString());
    group.appendChild(newPath);
    group.style.transform = `translateX(${SETTINGS.PLAYER_WIDTH_TRANSLATE_X}px) scaleX(${SETTINGS.PLAYER_WIDTH_SCALE_X})`;
    document.getElementById("gameBoard")?.appendChild(group);
    const playerPosition = document.getElementById(SETTINGS.PLAYER_POSITION_ID);
    const playerPositionRect = playerPosition?.getBoundingClientRect();
    const { x: currentPlayerViewportX } = playerPositionRect!;
    playerViewportX = currentPlayerViewportX;
    if (debuggerOn) addTextToSVGGroup(group, `viewport position x: ${playerViewportX.toFixed(2)}`, peakX, peakY + 15);
};
const makeGameBoard = ({
    fftData, 
    gameBoard,
    svgId,
    yOffset,
    xOffset,
}: TMakeGameBoardParams): void => {
    const startValue = Math.ceil(fftData.length * SETTINGS.INVADER_FFT_START_PERCENTAGE_OFFSET);
    const endValue = fftData.length - startValue;
    const binsPerRow = Math.floor((endValue - startValue) / gameBoard.length);
    const maxFFTValue = Math.max(...fftData);
    const minFFTValue = Math.min(...fftData);
    for(let i = 0; i < gameBoard.length; i++) {
        paintRowOfInvaders({
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
    moveInvadersLeftAndRight();
    if (runSweep) {
        lastTimeOscillator = currentTime;
        // connect oscillators and play frequencies based on active elements in gameBoard
        playTones({
            audioCtx: audioContext, 
            bracketFrequencyRanges,
            duration: SETTINGS.OSCILLATOR_DURATION as number,
            gainNode,
            gameBoard,
            time: audioContext.currentTime,
        });
        generatePlayerFrequency({
            audioCtx: playerAudioContext, 
            bracketFrequencyRanges,
            duration: SETTINGS.OSCILLATOR_DURATION as number,
            gainNode: playerGainNode,
            time: playerAudioContext.currentTime,
        });
    }
    analyzer.getByteFrequencyData(fftData);
    playerAnalyzer.getByteFrequencyData(playerFftData);

    // have the invaders's fft data changed since last frame?
    if(JSON.stringify([...fftData]) !== lastFFTData) { 
        yOffset += SETTINGS.INVADER_Y_MOVEMENT; // move invaders down slightly each frame
        svgId += 1; // track invader animation frames
        // rerun oscillator sweeps for invaders
        makeGameBoard({
            fftData: [...fftData],
            gameBoard,
            yOffset,
            svgId,
            xOffset,
        });
        const noInvadersLeft = gameBoard.flat().every(cell => cell === false);
        if(noInvadersLeft && !gameOver){
            gameOver = true;
            endGame();
        }
    }

    // has the player's fft data changed since last frame?

    if(JSON.stringify([...playerFftData]) !== lastPlayerFFTData) {
        playerSvgId += 1; // track player animation frames
        // rerun oscillator sweeps for player
        if(beginFire && currentlyFiring && laserBeginTime === undefined) {
            laserBeginTime = performance.now();
        }
        if(laserBeginTime !== undefined){
            laserYOffset += 20;
            const laserTimeElapsed = currentTime - laserBeginTime >= SETTINGS.LASER_DURATION;
            if(laserTimeElapsed){
                currentlyFiring = false;
                laserBeginTime = undefined;
                laserYOffset = 0;
            }
        }
        paintPlayerPosition({ 
            fftData: [...playerFftData],
        });
    }
    // update values for next frame comparison
    lastFFTData = JSON.stringify([...fftData]);
    lastPlayerFFTData = JSON.stringify([...playerFftData]);
    // rerun animation loop
    animationId = requestAnimationFrame(step);
};

function moveInvadersLeftAndRight(): void {
    const multiplier = gameBoard.flat().filter(e => !e).length + 1;
    const increments = multiplier * SETTINGS.INVADER_X_MOVEMENT;
    xOffset += (direction === DIRECTION.RIGHT ? increments : -increments);
    for (let i = 0; i < gameBoard.length; i++) {
        const svgGroup = document.getElementById(`group-${svgId}-row-${i}`);
        if(!svgGroup) continue;
        const { left, right } = svgGroup.getBoundingClientRect();
        if(right >= SETTINGS.INVADER_RIGHT_MOVEMENT_MAX){
            direction = DIRECTION.LEFT;
        }
        if(left <= SETTINGS.INVADER_LEFT_MOVEMENT_MIN){
            direction = DIRECTION.RIGHT;
        }
    }
};

function paintInvaderOnPeakFrequencies(bracketFrequencyRanges: { min: number; max: number }): number[] {
  const { min, max } = bracketFrequencyRanges;

  const invaderPerRow = SETTINGS.PEAK_COUNT / SETTINGS.ROW_COUNT; // 11 peaks per row

  const range = max - min;
  const linearSpacing = range / (invaderPerRow - 1);

  return Array.from({ length: invaderPerRow }, (_, i) => 
    Math.round(min + (i * linearSpacing))
  );
}

function paintInvaderOnPeak(x: number, y: number, className: string, group: SVGGElement, { row, column }: { row: number; column: number }): void {
    const invaderPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    invaderPath.setAttribute("d", invaderSVGPath);
    invaderPath.setAttribute("fill", SETTINGS.INVADER_COLOR);
    invaderPath.setAttribute("class", className);
    const originalWidth = 512;
    const targetWidth = SETTINGS.INVADER_WIDTH;
    const scale = targetWidth / originalWidth;

    const innerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    if(playerY !== 0 && y > playerY && !gameOver){
        console.log({ invaderY: y, playerY });
        gameOver = true;
        endGame();
    }
    innerGroup.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    innerGroup.setAttribute("class", className);
    innerGroup.setAttribute("id", `invader-row-${row}-column-${column}`);
    innerGroup.appendChild(invaderPath);

    group.appendChild(innerGroup);
};

function createSineWave(audioContext: AudioContext): PeriodicWave {
    // sine wave with only 1 harmonic
    const real = new Float32Array(2);
    const imag = new Float32Array(2);
    
    real[0] = 0; // Waveform never changes
    real[1] = 1; // Cosine value
    imag[0] = 0; // Waveform never changes
    imag[1] = 1; // Sine value
    
    return audioContext.createPeriodicWave(real, imag);
}

function connectAnalyzer(role: ROLE): void {
    const currentRole = role === ROLE.GAMEBOARD ? currentGame : player;
    const { analyzer, audioContext, gainNode } = currentRole!;
    gainNode.disconnect();
    gainNode.connect(analyzer);
    analyzer.connect(audioContext.destination);
    if(role === ROLE.GAMEBOARD){
        fftData = new Uint8Array(analyzer.frequencyBinCount);
    }else{
        playerFftData = new Uint8Array(analyzer.frequencyBinCount);
    }
};

// update button label based on current state
function currentStateLabel(): PLAY_STATE {
    let label = window.document.getElementById(SETTINGS.BUTTON_ID)!.textContent as PLAY_STATE_LABEL;
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
document.getElementById(SETTINGS.BUTTON_ID)?.addEventListener("click", () => {
    const currentState = currentStateLabel();
    if(currentState === PLAY_STATE.STOPPED) {
        startGame();
    }
    if(currentState === PLAY_STATE.PAUSED && gameStarted) {
        document.getElementById(SETTINGS.BUTTON_ID)!.textContent = PLAY_STATE_LABEL.PAUSE;
        playing = !playing;
        animationId = requestAnimationFrame(step);
    }
    if(currentState === PLAY_STATE.PLAYING && gameStarted) {
        document.getElementById(SETTINGS.BUTTON_ID)!.textContent = PLAY_STATE_LABEL.CONTINUE;
        if(animationId) cancelAnimationFrame(animationId); 
        playing = !playing;
    }
});

// DEBUGGER
const gridContainer = document.getElementById(DEBUGGER_SETTINGS.CONTROLLER_GRID_ID);

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
    // Toggle background color for debugger cell  (simulate hit)
    if (target.style.backgroundColor === DEBUGGER_SETTINGS.CONTROLLER_CELL_COLOR_ACTIVE) {
        target.style.backgroundColor = DEBUGGER_SETTINGS.CONTROLLER_CELL_COLOR_INACTIVE;
    } else {
        target.style.backgroundColor = DEBUGGER_SETTINGS.CONTROLLER_CELL_COLOR_ACTIVE;
    }
});

function updateControllerGrid (gameboard: TGameBoard): void {
    const gridContainer = document.getElementById(DEBUGGER_SETTINGS.CONTROLLER_GRID_ID);
    if (!gridContainer) return;

    gridContainer.innerHTML = ""; // Clear previous cells

    gameboard.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement("div");
            cellDiv.style.gridRow = (rowIndex + 1).toString();
            cellDiv.style.gridColumn = (colIndex + 1).toString();
            cellDiv.setAttribute("class", "controller-cell");
            cellDiv.setAttribute("id", `cell-${rowIndex}-${colIndex}`);
            if (cell) {
                cellDiv.style.backgroundColor = DEBUGGER_SETTINGS.CONTROLLER_CELL_COLOR_ACTIVE;
                cellDiv.style.cursor = "pointer";
            } else {
                cellDiv.style.backgroundColor = DEBUGGER_SETTINGS.CONTROLLER_CELL_COLOR_INACTIVE;
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
    const gridContainer = document.getElementById(DEBUGGER_SETTINGS.CONTROLLER_GRID_ID);
    gridContainer.style.visibility = "visible";
  }
  if( event.key === CONTROLS.VIM_RIGHT || event.key === CONTROLS.RIGHT) {
    if(playerPosition >= SETTINGS.PIXEL_WIDTH) return;
    playerPosition += SETTINGS.PLAYER_X_MOVEMENT;
  }
  if( event.key === CONTROLS.VIM_LEFT || event.key === CONTROLS.LEFT) {
    if(playerPosition <= 0) return;
    playerPosition -= SETTINGS.PLAYER_X_MOVEMENT;
  }
  if( event.key === CONTROLS.START) {
    const currentState = currentStateLabel();
    if(currentState === PLAY_STATE.STOPPED) {
        startGame();
    }
  }
  if( event.key === ' ') {
      if (!currentlyFiring) {
          beginFire = true;
          currentlyFiring = true;
      }
  }
});