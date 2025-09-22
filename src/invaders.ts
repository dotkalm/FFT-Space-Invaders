import { pulse } from "./constants/waveTables/pulse.js";
import { playSweep } from "./helpers/playSweep.js";
import { TCurrentGame, TGameBoard } from "./types/index.js";
import { makeSVGRows } from "./components/SVG.js";

import { 
    ID,
    INITIAL_VALUES,
    PLAY_STATE,
    PLAY_STATE_LABEL,
    SETTINGS,
} from './constants/index.js';

const gameBoard = new Array(5).fill(new Array(11).fill(true)) as TGameBoard;
let animationId: number;
let yOffset: number = 0;
let currentGame: TCurrentGame | null = null;
let fftData: Uint8Array<ArrayBuffer>;
let gameStarted: boolean = false;
let lastTimeOscillator = 0;
let oscillatorCount: number = INITIAL_VALUES.OSCILLATOR_COUNT;
let playing: boolean;
let lastFFTData: string = '';
let svgId: number = 0;

const gameSetup = (): TCurrentGame => {
    gameStarted = true;
    const stateButton = window.document.getElementById(ID.STATE_BUTTON);
    stateButton.textContent = PLAY_STATE_LABEL.PAUSE;
    const audioContext: AudioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = INITIAL_VALUES.BIN_COUNT;
    const gainNode: GainNode = audioContext.createGain();
    gainNode.gain.value = SETTINGS.GAIN_VALUE;
    gainNode.connect(audioContext.destination);
    animate();
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
    if (runSweep) {
        lastTimeOscillator = currentTime;
        playSweep({
            audioCtx: audioContext, 
            duration: SETTINGS.OSCILLATOR_DURATION,
            gainNode,
            gameBoard,
            oscillatorCount,
            time: audioContext.currentTime,
            waveTable: pulse,
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