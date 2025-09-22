import { 
    type TPlaySweep,
    type TConnectNewOscilator,
} from "../types";
import { waveMaker } from "../helpers/index.js";
import { INITIAL_VALUES, END_VALUES } from "../constants/index.js";

export const playSweep: TPlaySweep = ({
  time, 
  audioCtx, 
  waveTable, 
  duration, 
  gainNode, 
  gameBoard,
  oscillatorCount,
}) => {
  const periodicWave = waveMaker(waveTable, audioCtx);
  const rowCount = gameBoard.filter(row => row.some(position => position)).length;
  const removedRows = gameBoard.length - rowCount;
  const frequencyRangePerRow = (INITIAL_VALUES.FREQUENCY_RANGE - END_VALUES.FREQUENCY_RANGE) / gameBoard.length;
  const frequencyRange = INITIAL_VALUES.FREQUENCY_RANGE - (removedRows * frequencyRangePerRow);
  const beginningFrequency = -(frequencyRange / 4);
  const intervalSpaces = frequencyRange / (oscillatorCount - 1);
  gameBoard.flat().forEach((position, rowIndex) => {
    if(position) {
      const frequency = Math.round(beginningFrequency + (rowIndex * intervalSpaces));
      connectNewOscillator({ audioCtx, periodicWave, gainNode, frequency, time, duration });
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