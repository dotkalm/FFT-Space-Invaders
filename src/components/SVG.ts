import { TGameBoard } from "../types/index.js";
import { SETTINGS, FFT_CONFIG, binResolution} from "../constants/index.js";
import { generatePeakFrequencies } from "../helpers/playSweep.js";

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
    const binsPerRow = Math.floor(fftData.length / gameBoard.length);
    for(let i = 0; i < gameBoard.length; i++) {
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