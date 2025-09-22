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
}

export enum INITIAL_VALUES {
  INTERVAL = 120,
  OSCILLATOR_COUNT = 55,
  ROWS = 5,
  FREQUENCY_RANGE = 24000,
  BIN_COUNT = 2048,
}

export enum END_VALUES {
  FREQUENCY_RANGE = 24000,
  BIN_COUNT = 2048,
}