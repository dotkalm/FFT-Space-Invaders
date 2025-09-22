export interface TWaveTable {
  real: number[];
  imag: number[];
}

export type TWaveMaker = (wavetable: TWaveTable, audioCtx: AudioContext) => PeriodicWave;

export type TPlaySweep = (params: TPlaySweepParams) => void;

export type TGameBoard = [
  [boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean],
  [boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean],
  [boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean],
  [boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean],
  [boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean],
];

export interface TPlaySweepParams {
  audioCtx: AudioContext;
  duration: number;
  gainNode: GainNode;
  gameBoard: TGameBoard;
  oscillatorCount: number;
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

export interface TMakeOscillatorIntervalsParams {
  intervalSpaces: number;
  frequencyRange: number;
}

export type TMakeOscillatorIntervalValue = (params: TMakeOscillatorIntervalsParams) => number;