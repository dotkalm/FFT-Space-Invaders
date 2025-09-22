import { playSweep } from "./helpers/playSweep.js";
import { TCurrentGame, TGameBoard } from "./types/index.js";
import { makeSVGRows } from "./components/SVG.js";
import { updateControllerGrid } from "./helpers/controllerGrid.js";

import { 
    ID,
    INITIAL_VALUES,
    PLAY_STATE,
    PLAY_STATE_LABEL,
    SETTINGS,
    FFT_CONFIG,
    initialBracketFrequencyRanges,
} from './constants/index.js';

let gameBoard = new Array(5).fill(new Array(11).fill(true)) as TGameBoard;
let animationId: number;
let yOffset: number = 0;
let currentGame: TCurrentGame | null = null;
let fftData: Uint8Array<ArrayBuffer>;
let gameStarted: boolean = false;
let lastTimeOscillator = 0;
let playing: boolean;
let lastFFTData: string = '';
let svgId: number = 0;
let direction: "left" | "right" = "right";
let xOffset: number = 0;
let xFrequencyOffset: number = 0;
const bracketFrequencyRanges = [...initialBracketFrequencyRanges];

const gameSetup = (): TCurrentGame => {
    gameStarted = true;
    const stateButton = window.document.getElementById(ID.STATE_BUTTON);
    stateButton.textContent = PLAY_STATE_LABEL.PAUSE;
    const audioContext: AudioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_CONFIG.fftSize;
    const gainNode: GainNode = audioContext.createGain();
    gainNode.gain.value = SETTINGS.GAIN_VALUE;
    gainNode.connect(audioContext.destination);
    animate();
    updateControllerGrid(gameBoard);
    return {
        audioContext,
        analyser,
        gainNode,
    };
};

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

window.document.getElementById(ID.STATE_BUTTON)?.addEventListener("click", () => {
    const currentState = currentStateLabel();
    if(currentState === PLAY_STATE.STOPPED) {
        currentGame = gameSetup();
        connectAnalyser();
        playing = !playing;
    }
    if(currentState === PLAY_STATE.PAUSED && gameStarted) {
        window.document.getElementById(ID.STATE_BUTTON)!.textContent = PLAY_STATE_LABEL.PAUSE;
        playing = !playing;
        animationId = requestAnimationFrame(step);
    }
    if(currentState === PLAY_STATE.PLAYING && gameStarted) {
        window.document.getElementById(ID.STATE_BUTTON)!.textContent = PLAY_STATE_LABEL.CONTINUE;
        if(animationId) cancelAnimationFrame(animationId); 
        playing = !playing;
    }
});

function animate(): void {
    animationId = requestAnimationFrame(step);
}

function step(): void {
    if(!currentGame) return;
    const { analyser, audioContext, gainNode } = currentGame;
    const currentTime = performance.now();
    const runSweep = currentTime - lastTimeOscillator >= INITIAL_VALUES.INTERVAL;
    moveDirectionXTransform();
    //moveDirection();
    if (runSweep) {
        lastTimeOscillator = currentTime;
        playSweep({
            audioCtx: audioContext, 
            bracketFrequencyRanges,
            duration: SETTINGS.OSCILLATOR_DURATION,
            gainNode,
            gameBoard,
            time: audioContext.currentTime,
        });
    }
    analyser.getByteFrequencyData(fftData);
    if(JSON.stringify([...fftData]) !== lastFFTData) {
        yOffset += 0.005;
        svgId += 1;
        makeSVGRows({
            fftData: [...fftData],
            gameBoard,
            yOffset,
            svgId,
            xOffset,
        });
    }
    lastFFTData = JSON.stringify([...fftData]);
    animationId = requestAnimationFrame(step);
};

function connectAnalyser(): void {
    const { analyser, audioContext, gainNode } = currentGame!;
    gainNode.disconnect();
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);
    fftData = new Uint8Array(analyser.frequencyBinCount);
};
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

function moveDirectionXTransform(): void {
    const multiplier = gameBoard.flat().filter(e => !e).length + 1;
    const increments = multiplier * 0.08;
    xOffset += (direction === "right" ? increments : -increments);
    for (let i = 0; i < gameBoard.length; i++) {
        const svgGroup = document.getElementById(`group-${svgId}-row-${i}`);
        if(!svgGroup) continue;
        const { left, right } = svgGroup.getBoundingClientRect();
        if(right >= 680){
            direction = "left";
        }
        if(left <= 20){
            direction = "right";
        }
    }
};