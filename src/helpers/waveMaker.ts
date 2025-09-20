import { type TWaveMaker } from '@/types';

export const waveMaker: TWaveMaker = (wavetable, audioCtx) => {
  return new PeriodicWave(audioCtx, {
    real: wavetable.real,
    imag: wavetable.imag,
  });
}