import { warmSaw } from "./constants/waveTables/warmSaw.js";
import { playSweep } from "./helpers/playSweep.js";

const gameSetup = () => {
    const audioContext: AudioContext = new AudioContext();
    const analyser: AnalyserNode = audioContext.createAnalyser();
    const gainNode: GainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;
    gainNode.connect(audioContext.destination);
    let animate = true;

    let animationId: number = 0;
    let lastTime = 0;
    const targetInterval = 1000;

    let performanceMeasure = performance.measure("fps");
    const step = () => {
        const currentTime = performance.now();
        animationId += 1;
        if (currentTime - lastTime >= targetInterval) {
            lastTime = currentTime;
            performanceMeasure = performance.measure("fps");
            console.log("fps", performanceMeasure.duration);

            playSweep({
                time: audioContext.currentTime,
                audioCtx: audioContext, 
                waveTable: warmSaw,
                frequency: 440,
                duration: 0.5,
                gainNode,
            });
        }
        animate && requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
};

window.document.getElementById("startButton")?.addEventListener("click", () => {
    gameSetup();
});