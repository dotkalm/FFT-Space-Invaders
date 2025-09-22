import { 
    type TPlaySweep,
    type TConnectNewOscilator,
} from "../types";
import { createPureSineWave } from "../helpers/index.js";
import { FFT_CONFIG,  } from "../constants/index.js";

export const playSweep: TPlaySweep = ({
  audioCtx, 
  bracketFrequencyRanges,
  duration, 
  gainNode, 
  gameBoard,
  time, 
}) => {
    const sineWave = createPureSineWave(audioCtx);
    
    let timeOffset = 0;
    gameBoard.forEach((row, rowIndex) => {
      const frequencies = generatePeakFrequencies(rowIndex, bracketFrequencyRanges[rowIndex]);
      row.forEach((isActive, index) => {
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
    });
};

export function generatePeakFrequencies(rowIndex: number, bracketFrequencyRanges: { min: number; max: number }): number[] {
  const { min, max } = bracketFrequencyRanges;
  const { peakCount: totalPeaks, rowCount} = FFT_CONFIG;
  const peakCount = totalPeaks / rowCount;

  const range = max - min;
  const linearSpacing = range / (peakCount - 1);

  return Array.from({ length: peakCount }, (_, i) => 
    Math.round(min + (i * linearSpacing))
  );

}