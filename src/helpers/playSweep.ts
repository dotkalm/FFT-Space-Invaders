import { 
    type TPlaySweep,
    type TConnectNewOscilator,
} from "../types";
import { createPureSineWave } from "../helpers/index.js";
import { INITIAL_VALUES, END_VALUES, SETTINGS, FFT_CONFIG, binResolution } from "../constants/index.js";

export const playSweep: TPlaySweep = ({
  time, 
  audioCtx, 
  waveTable, 
  duration, 
  gainNode, 
  gameBoard,
  oscillatorCount,
}) => {
    const frequencies = generatePeakFrequencies(FFT_CONFIG);
    const sineWave = createPureSineWave(audioCtx);
    
    // Map game board positions to frequencies
    const flatBoard = gameBoard.flat();
    
    let timeOffset = 0;
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
            timeOffset += .001;
            osc.start(time + timeOffset);
            osc.stop(time + timeOffset + duration);
        }
    });
};

const connectNewOscillator: TConnectNewOscilator = ({ audioCtx, periodicWave, gainNode, frequency, time, duration }) => {
  const osc = new OscillatorNode(audioCtx, {
    frequency,
    type: "custom",
    periodicWave,
  });
  osc.connect(gainNode);
  osc.start(time);
  osc.stop(time + duration);
}

function generatePeakFrequencies(config: typeof FFT_CONFIG): number[] {

  const { min, max } = config.frequencyRange;
  const peakCount = config.peakCount;

  // Option 1: Linear spacing with minimum separation
  const minSeparation = binResolution * .2; // At least 3 bins apart
  const range = max - min;
  const linearSpacing = range / (peakCount - 1);

  if (linearSpacing >= minSeparation) {
    // Linear spacing works
    return Array.from({ length: peakCount }, (_, i) =>
      Math.round(min + (i * linearSpacing))
    );
  }

  // Option 2: Logarithmic spacing (better for audio)
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logStep = (logMax - logMin) / (peakCount - 1);

  return Array.from({ length: peakCount }, (_, i) =>
    Math.round(Math.pow(10, logMin + (i * logStep)))
  );
}