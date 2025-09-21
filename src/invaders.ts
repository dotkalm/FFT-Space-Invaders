import { guitarFuzz } from "./constants/waveTables/guitarFuzz.js";
import { playSweep } from "./helpers/playSweep.js";
import { 
    TCurrentGame,
    PLAY_STATE,
    PLAY_STATE_LABEL,
    ID,
} from "./types/index.js";

let playing: boolean;
let gameStarted: boolean = false;
let currentGame: TCurrentGame | null = null;
let animationId: number | null = null;
let lastTime = 0;
let performanceMeasure: PerformanceMeasure;
const targetInterval = 1500;

const gameSetup = (): TCurrentGame => {
    gameStarted = true;
    window.document.getElementById(ID.STATE_BUTTON)!.textContent = PLAY_STATE_LABEL.START;
    const audioContext: AudioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const gainNode: GainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;
    gainNode.connect(audioContext.destination);
    animate();
    return {
        audioContext,
        analyser,
        gainNode,
    };
};

function currentStateLabel(): PLAY_STATE {
    let label = window.document.getElementById(ID.STATE_BUTTON)!.textContent as 'Pause Game' | 'Continue Game' | 'Start Game';
    switch (label) {
        case PLAY_STATE_LABEL.PAUSE:
            return PLAY_STATE.PLAYING;
        case PLAY_STATE_LABEL.CONTINUE:
            return PLAY_STATE.PAUSED;
        case PLAY_STATE_LABEL.START:
            return PLAY_STATE.STOPPED;
    }
}

window.document.getElementById(ID.STATE_BUTTON)?.addEventListener("click", () => {
    const currentState = currentStateLabel();
    if(currentState === PLAY_STATE.STOPPED) {
        currentGame = gameSetup();
        playing = !playing;
    }
    if(currentState === PLAY_STATE.PAUSED && gameStarted) {
        window.document.getElementById(ID.STATE_BUTTON)!.textContent = "Pause Game";
        playing = !playing;
        animationId = requestAnimationFrame(step);
    }
    if(currentState === PLAY_STATE.PLAYING && gameStarted) {
        window.document.getElementById(ID.STATE_BUTTON)!.textContent = "Continue Game";
        if(animationId) cancelAnimationFrame(animationId); 
        playing = !playing;
    }
});

function animate(): void {
    performanceMeasure = performance.measure(ID.FPS);
    animationId = requestAnimationFrame(step);
}

function step(): void {
    if(!currentGame) return;
    const { audioContext, gainNode } = currentGame;
    const currentTime = performance.now();
    if (currentTime - lastTime >= targetInterval) {
        lastTime = currentTime;
        performanceMeasure = performance.measure(ID.FPS);
        playSweep({
            time: audioContext.currentTime,
            audioCtx: audioContext, 
            waveTable: guitarFuzz,
            duration: 0.01,
            gainNode,
        });
    }
    animationId = requestAnimationFrame(step);
};
