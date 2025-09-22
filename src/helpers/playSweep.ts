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
    const frequencies = generatePeakFrequencies(FFT_CONFIG);
    const sineWave = createPureSineWave(audioCtx);
    const flatBoard = gameBoard[gameBoard.length -1 ];
    
    let timeOffset = 0;
    const firstTrue = flatBoard.indexOf(true);
    const lastTrue = flatBoard.lastIndexOf(true);
    const range = (lastTrue - firstTrue) + 1;
    const lastTrueFrequency = frequencies[lastTrue];
    const firstTrueFrequency = frequencies[firstTrue];
    const frequencyRange = lastTrueFrequency - firstTrueFrequency;
    moveDirectionCallback();
    flatBoard.forEach((isActive, index) => {
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
            timeOffset += .01;
            osc.start(time + timeOffset);
            osc.stop(time + timeOffset + duration);
        }
    });
};

export function generatePeakFrequencies(config: typeof FFT_CONFIG): number[] {

  const { min, max } = config.frequencyRange;
  const peakCount = config.peakCount;

  const range = max - min;
  const linearSpacing = range / (peakCount - 1);

  return Array.from({ length: peakCount }, (_, i) =>
    Math.round(min + (i * linearSpacing))
  );

}