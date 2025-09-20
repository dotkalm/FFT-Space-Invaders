import { 
    type TPlaySweep,
    type TConnectNewOscilator,
} from "@/types";
import { waveMaker } from "../helpers";

export const playSweep: TPlaySweep = ({time, audioCtx, waveTable, duration, gainNode}) => {
  const periodicWave = waveMaker(waveTable, audioCtx);
  [300, 5000, 10000].forEach(frequency => {
    connectNewOscillator({ audioCtx, periodicWave, gainNode, frequency, time, duration });
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