import {
    TMakeOscillatorIntervalValue,
} from '../types/index.js';

export const makeOscillatorIntervalValue: TMakeOscillatorIntervalValue= ({
    intervalSpaces,
    frequencyRange,
}) => {
    const floatValue = frequencyRange / (intervalSpaces -1);
    return Number(floatValue.toFixed(2));
};