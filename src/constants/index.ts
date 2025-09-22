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

export enum SETTINGS {
  GAIN_VALUE = 0.5,
  OSCILLATOR_DURATION = 0.1,
  ROWS = 5,
  PIXEL_WIDTH = 800,
  SAMPLE_RATE = 44100,
  FFT_SIZE = 8192,
}

export enum INITIAL_VALUES {
  INTERVAL = 120,
  OSCILLATOR_COUNT = 55,
  ROWS = 5,
  FREQUENCY_RANGE = 24000,
  BIN_COUNT = 512,
}

export enum END_VALUES {
  FREQUENCY_RANGE = 24000,
  BIN_COUNT = 2048,
}

export const FFT_CONFIG = {
    sampleRate: 44100,
    fftSize: 2048,
    frequencyRange: { min: 2000, max: 22000 }, // Avoid DC and very high frequencies
    peakCount: 55
}; 
  
export const binResolution = FFT_CONFIG.sampleRate / FFT_CONFIG.fftSize; // ~5.38 Hz per bin