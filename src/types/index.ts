export interface TWaveTable {
  real: number[];
  imag: number[];
}

export type TWaveMaker = (wavetable: TWaveTable, audioCtx: AudioContext) => PeriodicWave;

export type TPlaySweep = (params: TPlaySweepParams) => void;

export interface TPlaySweepParams {
  audioCtx: AudioContext;
  duration: number;
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

export interface TCurrentGame {
    audioContext: AudioContext;
    analyser: AnalyserNode;
    gainNode: GainNode;
};

export enum PLAY_STATE {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
};

export enum PLAY_STATE_LABEL {
  PAUSE = 'Pause Game',
  CONTINUE = 'Continue Game',
  START = 'Start Game',
}

export enum ID {
  FPS = 'fps',
  STATE_BUTTON = 'stateButton'
}