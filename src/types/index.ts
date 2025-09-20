export interface TWaveTable {
  real: number[];
  imag: number[];
}

export type TWaveMaker = (wavetable: TWaveTable, audioCtx: AudioContext) => PeriodicWave;

export type TPlaySweep = (params: TPlaySweepParams) => void;

export interface TPlaySweepParams {
  audioCtx: AudioContext;
  duration: number;
  frequency: number;
  gainNode: GainNode;
  time: number;
  waveTable: TWaveTable;
}

export interface TConnectNewOscilatorArguments {
    audioCtx: AudioContext;
    periodicWave: PeriodicWave;
    gainNode: GainNode;
    frequency: number;
    time: number;
    duration: number;
}

export type TConnectNewOscilator = (args: TConnectNewOscilatorArguments) => void;
