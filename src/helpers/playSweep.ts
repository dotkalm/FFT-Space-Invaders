import { 
    type TPlaySweep,
    type TConnectNewOscilator,
} from "../types";
import { createPureSineWave } from "../helpers/index.js";
import { INITIAL_VALUES, END_VALUES, SETTINGS, FFT_CONFIG, binResolution } from "../constants/index.js";

export const playSweep: TPlaySweep = ({
  time, 
  audioCtx, 
  duration, 
  gainNode, 
  gameBoard,
  moveDirectionCallback,
}) => {
    const frequencies = generatePeakFrequencies();
    const sineWave = createPureSineWave(audioCtx);
    console.log("frequencies", frequencies);
    
    let timeOffset = 0;
    moveDirectionCallback();
    gameBoard.flat().forEach((isActive, index) => {
        if (isActive && index < frequencies.length) {
            const frequency = frequencies[index];
            
            // Create oscillator for this specific frequency
            const osc = audioCtx.createOscillator();
            osc.frequency.setValueAtTime(frequency, time);
            osc.setPeriodicWave(sineWave);
            
            // Individual gain control for this peak
            const peakGain = audioCtx.createGain();
            peakGain.gain.setValueAtTime(0.1, time); // Lower individual gain
            
            osc.connect(peakGain);
            peakGain.connect(gainNode);
            timeOffset += .001;
            osc.start(time + timeOffset);
            osc.stop(time + timeOffset + duration);
        }
    });
};

export function generatePeakFrequencies(): number[] {
  const config = FFT_CONFIG
  const { min, max } = config.frequencyRange;
  const peakCount = config.peakCount;

  const range = max - min;
  const linearSpacing = range / (peakCount - 1);

  return Array.from({ length: peakCount }, (_, i) => {
    const spacing = Math.round(min + (i * linearSpacing))
    const startOfRow = i % 12 === 0 && i !== 0;
    return !startOfRow ? spacing : spacing + 50;
  }
  );

}