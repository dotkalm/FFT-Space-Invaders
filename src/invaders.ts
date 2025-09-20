function gameSetup(): void {
    const audioContext: AudioContext= new AudioContext();
    const analyser: AnalyserNode = audioContext.createAnalyser();
    const gainNode: GainNode = audioContext.createGain();

    function contextInit(): void {
        const { gain, connect: gainConnect } = audioContext.createGain();
        gain.value = 0.1;
        gainConnect(audioContext.destination);
    }
}