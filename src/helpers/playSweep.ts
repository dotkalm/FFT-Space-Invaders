import { 
    type TPlaySweep,
    type TConnectNewOscilator,
} from "@/types";
import { waveMaker } from "../helpers/index.js";

export const playSweep: TPlaySweep = ({time, audioCtx, waveTable, duration, gainNode}) => {
  const periodicWave = waveMaker(waveTable, audioCtx);
  [-24000, -10000, 1000, 24000].forEach(frequency => {
    connectNewOscillator({ audioCtx, periodicWave, gainNode, frequency, time: time + 0.1, duration });
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