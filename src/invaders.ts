import { playSweep } from "@/utils";

const audioContext: AudioContext= new AudioContext();
const analyser: AnalyserNode = audioContext.createAnalyser();
const gainNode: GainNode = audioContext.createGain();

function gameSetup(): void {
    function contextInit(): void {
        const { gain, connect: gainConnect } = audioContext.createGain();
        gain.value = 0.1;
        gainConnect(audioContext.destination);
    }
    contextInit();
    let animationId: number = 0;
    let lastTime = 0;
    const targetInterval = 1000;
    let performanceMeasure = performance.measure("fps");
    const step = () => {
        const currentTime = performance.now();
        animationId += 1;
        if (currentTime - lastTime >= targetInterval) {
            lastTime = currentTime;
            console.log(currentTime, animationId, performanceMeasure);
            performanceMeasure = performance.measure("fps");
        }
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

gameSetup();