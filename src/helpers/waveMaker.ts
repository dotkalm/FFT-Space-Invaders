import { type TWaveMaker } from '@/types';

export const waveMaker: TWaveMaker = (wavetable, audioCtx) => {
  return new PeriodicWave(audioCtx, {
    real: wavetable.real,
    imag: wavetable.imag,
  });
}

export function createPureSineWave(audioContext: AudioContext): PeriodicWave {
    // Pure sine wave: only first harmonic
    const real = new Float32Array(2);
    const imag = new Float32Array(2);
    
    real[0] = 0; // DC component
    real[1] = 1; // Cosine component of fundamental
    imag[0] = 0; // DC component  
    imag[1] = .01; // Sine component of fundamental
    
    return audioContext.createPeriodicWave(real, imag);
}
