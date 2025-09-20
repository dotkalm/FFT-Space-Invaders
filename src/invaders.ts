import { 
    playSweep,
} from "@/utils";

function gameSetup(): void {
    const audioContext: AudioContext= new AudioContext();
    const analyser: AnalyserNode = audioContext.createAnalyser();
    const gainNode: GainNode = audioContext.createGain();

    function contextInit(): void {
        const { gain, connect: gainConnect } = audioContext.createGain();
        gain.value = 0.1;
        gainConnect(audioContext.destination);
    }
    contextInit();
}

const zero = performance.now();
let animationId: number = 0;
const step = () => {
    animationId += 1;
    console.log('step', animationId);
    const value = (performance.now() - zero) / 30;
    console.log(value);
    if(value < 300) {
        requestAnimationFrame(step);
    }
};

requestAnimationFrame(step);
