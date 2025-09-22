import { TGameBoard } from "../types/index.js";
import { SETTINGS, FFT_CONFIG, binResolution} from "../constants/index.js";

type TMakeRowParams = {
    binEndIndex: number;
    binStartIndex: number;
    binsPerRow: number;
    fftData: number[];
    rowIndex: number;
    yOffset: number;
    svgId: number;
}
type TmakeSvgRowsParams = {
    fftData: number[];
    gameBoard: TGameBoard;
    yOffset: number;
    svgId: number;
}
export const makeSVGRows = ({
    fftData, 
    gameBoard,
    svgId,
    yOffset,
}: TmakeSvgRowsParams): void => {
    const binsPerRow = Math.floor(fftData.length);
    for(let i = 0; i < 1; i++) {
        updateMakeSVGRowWithPeakDetection({ 
            yOffset,
            svgId,
            binEndIndex: (i + 1) * binsPerRow,
            binStartIndex: i * binsPerRow,
            binsPerRow,
            fftData,
            rowIndex: i,
        });
    }
};

function makeDebugLabels({
    currentValue,
    i: binIndex,
    rowIndex,
    svgId,
    yOffset,
    peakCount,
    x,
}): void {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x.toFixed(2));
    circle.setAttribute("cy", ((yOffset + (rowIndex * 100)) + (currentValue / 2)).toFixed(2));
    circle.setAttribute("r", "10");
    circle.setAttribute("fill", "green");
    circle.setAttribute("class", `peak-${svgId}-row-${rowIndex}`);
    // Add text label for peakCount
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x.toFixed(2));
    text.setAttribute("y", (((yOffset + (rowIndex * 100)) + (currentValue / 2) + 4)).toFixed(2)); // +4 to vertically center text
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "white");
    text.setAttribute("font-size", "10");
    text.textContent = peakCount.toString();
    document.getElementById("gameBoard")?.appendChild(circle);
    document.getElementById("gameBoard")?.appendChild(text);
    // Set unique id for text
    text.setAttribute("class", `peak-${svgId}-row-${rowIndex}`);
    // Add another green circle below the previous one
    const lowerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    lowerCircle.setAttribute("cx", x.toFixed(2));
    lowerCircle.setAttribute("cy", (((yOffset + (rowIndex * 100)) + (currentValue / 2) + 20)).toFixed(2)); // 20px below
    lowerCircle.setAttribute("r", "10");
    lowerCircle.setAttribute("fill", "green");
    lowerCircle.setAttribute("class", `peak-${svgId}-row-${rowIndex}`);
    document.getElementById("gameBoard")?.appendChild(lowerCircle);

    // Insert bin index as text inside the lower circle
    const binText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    binText.setAttribute("x", x.toFixed(2));
    binText.setAttribute("y", (((yOffset + (rowIndex * 100)) + (currentValue / 2) + 24)).toFixed(2)); // +24 to vertically center text in lower circle
    binText.setAttribute("text-anchor", "middle");
    binText.setAttribute("fill", "white");
    binText.setAttribute("font-size", "10");
    binText.textContent = binIndex.toString();
    binText.setAttribute("class", `peak-${svgId}-row-${rowIndex}`);
    document.getElementById("gameBoard")?.appendChild(binText);
};

export const updateMakeSVGRowWithPeakDetection = ({ 
    binEndIndex,
    binStartIndex,
    binsPerRow,
    fftData,
    rowIndex,
    yOffset,
    svgId,
}: {
    binEndIndex: number;
    binStartIndex: number;
    binsPerRow: number;
    fftData: number[];
    rowIndex: number;
    yOffset: number;
    svgId: number;
}) => {
    // Your existing path drawing code...
    const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newPath.setAttribute("id", `row-${rowIndex}`);
    let path = `M 0 ${yOffset + (rowIndex * 100)}`;
    let x = 0;
    const stepWidth = Number((800 / binsPerRow).toFixed(2)); // Using your PIXEL_WIDTH

    // Remove old peaks
    const allPeaks = document.getElementsByClassName(`peak-${svgId-1}-row-${rowIndex}`);
    while(allPeaks[0]) {
        allPeaks[0].parentNode?.removeChild(allPeaks[0]);
    }

    // Draw the FFT path
    for(let i = binStartIndex; i < binEndIndex; i++) {
        x += stepWidth;
        const y = (yOffset + (rowIndex * 100)) + (fftData[i] / 2);
        path = `${path} L${x.toFixed(2)} ${y.toFixed(2)}`;
    }

    // REPLACE your peak detection loop with this:
    // Get frequencies for this row
    const frequenciesPerRow = 1; // 5 rows
    const rowStartFreqIndex = rowIndex * frequenciesPerRow;
    const rowEndFreqIndex = Math.min(rowStartFreqIndex + frequenciesPerRow, PEAK_FREQUENCIES.length);
    const rowFrequencies = PEAK_FREQUENCIES.slice(rowStartFreqIndex, rowEndFreqIndex);

    // Detect peaks at expected frequencies
    const detectedPeaks = detectAndMapPeaks(
        fftData.slice(binStartIndex, binEndIndex),
        rowFrequencies,
        FFT_CONFIG.sampleRate,
        FFT_CONFIG.fftSize
    );

    // Draw detected peaks
    detectedPeaks.forEach((peak, peakIndex) => {
        const adjustedBin = peak.bin - binStartIndex; // Adjust for row offset
        if (adjustedBin >= 0 && adjustedBin < binsPerRow) {
            const peakX = adjustedBin * stepWidth;
            makeDebugLabels({
                currentValue: peak.magnitude,
                i: peak.bin,
                rowIndex,
                svgId,
                yOffset,
                peakCount: peakIndex + 1,
                x: peakX,
            });
        }
    });

    // Your existing path completion code...
    newPath.setAttribute("d", path);
    newPath.setAttribute("fill", "none");
    newPath.setAttribute("stroke", "black");
    newPath.setAttribute("stroke-width", "0.5");
    
    if(yOffset > -1){
        const oldPath = document.getElementById(`iteration-${svgId - 1}-row-${rowIndex}`);
        oldPath?.remove();
    }
    newPath.setAttribute("id", `iteration-${svgId}-row-${rowIndex}`);
    document.getElementById("gameBoard")?.appendChild(newPath);
};

// Usage example with your constants
const PEAK_FREQUENCIES = generatePeakFrequencies(FFT_CONFIG);
console.log('Peak frequencies:', PEAK_FREQUENCIES.slice(0, 10), '...'); // Show first 10

// Peak removal function
export const removePeak = (peakIndex: number, gameBoard: boolean[][]) => {
    const flatIndex = peakIndex;
    const rowIndex = Math.floor(flatIndex / gameBoard[0].length);
    const colIndex = flatIndex % gameBoard[0].length;
    
    if (rowIndex < gameBoard.length && colIndex < gameBoard[0].length) {
        gameBoard[rowIndex][colIndex] = false;
        return { rowIndex, colIndex };
    }
    return null;
};


function generatePeakFrequencies(config: typeof FFT_CONFIG): number[] {
    const { min, max } = config.frequencyRange;
    const peakCount = config.peakCount;
    
    // Option 1: Linear spacing with minimum separation
    const minSeparation = binResolution * 3; // At least 3 bins apart
    const range = max - min;
    const linearSpacing = range / (peakCount - 1);
    
    if (linearSpacing >= minSeparation) {
        // Linear spacing works
        return Array.from({ length: peakCount }, (_, i) => 
            Math.round(min + (i * linearSpacing))
        );
    }
    
    // Option 2: Logarithmic spacing (better for audio)
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const logStep = (logMax - logMin) / (peakCount - 1);
    
    return Array.from({ length: peakCount }, (_, i) => 
        Math.round(Math.pow(10, logMin + (i * logStep)))
    );
}

export const detectAndMapPeaks = (
    fftData: number[], 
    expectedFrequencies: number[],
    sampleRate: number,
    fftSize: number
) => {
    const binResolution = sampleRate / fftSize;
    const peaks: { frequency: number, bin: number, magnitude: number, index: number }[] = [];
    
    expectedFrequencies.forEach((expectedFreq, index) => {
        // Calculate expected bin
        const expectedBin = Math.round(expectedFreq / binResolution);
        
        // Search in a small window around expected bin
        const searchRange = 2; // ±2 bins
        let maxMagnitude = 0;
        let peakBin = expectedBin;
        
        for (let bin = Math.max(0, expectedBin - searchRange); 
             bin <= Math.min(fftData.length - 1, expectedBin + searchRange); 
             bin++) {
            if (fftData[bin] > maxMagnitude) {
                maxMagnitude = fftData[bin];
                peakBin = bin;
            }
        }
        
        if (maxMagnitude > 0) {
            peaks.push({
                frequency: expectedFreq,
                bin: peakBin,
                magnitude: maxMagnitude,
                index
            });
        }
    });
    
    return peaks;
};