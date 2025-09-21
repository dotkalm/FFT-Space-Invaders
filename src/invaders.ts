import { guitarFuzz } from "./constants/waveTables/guitarFuzz.js";
import { playSweep } from "./helpers/playSweep.js";
import { TCurrentGame } from "./types/index.js";

let playing: boolean;
let gameStarted: boolean = false;
let currentGame: TCurrentGame | null = null;
let animationId: number | null = null;
let lastTime = 0;
let performanceMeasure: PerformanceMeasure;
const targetInterval = 1500;

const gameSetup = (): TCurrentGame => {
    gameStarted = true;
    window.document.getElementById("startButton")!.textContent = "Pause Game";
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

function currentStateLabel(): 'playing' | 'paused' | 'stopped' {
    let label = window.document.getElementById("startButton")!.textContent as 'Pause Game' | 'Continue Game' | 'Start Game';
    switch (label) {
        case 'Pause Game':
            return 'playing';
        case 'Continue Game':
            return 'paused';
        case 'Start Game':
            return 'stopped';
    }
}

window.document.getElementById("startButton")?.addEventListener("click", () => {
    const currentState = currentStateLabel();
    console.log({currentState, gameStarted})
    if(currentState === "stopped") {
        currentGame = gameSetup();
        playing = !playing;
    }
    if(currentState === "paused" && gameStarted) {
        window.document.getElementById("startButton")!.textContent = "Pause Game";
        playing = !playing;
        animationId = requestAnimationFrame(step);
    }
    if(currentState === "playing" && gameStarted) {
        window.document.getElementById("startButton")!.textContent = "Continue Game";
        if(animationId) cancelAnimationFrame(animationId); 
        playing = !playing;
    }
});

function animate(): void {
    performanceMeasure = performance.measure("fps");
    animationId = requestAnimationFrame(step);
}

function step(): void {
    if(!currentGame) return;
    const { audioContext, gainNode } = currentGame;
    const currentTime = performance.now();
    if (currentTime - lastTime >= targetInterval) {
        lastTime = currentTime;
        performanceMeasure = performance.measure("fps");
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
