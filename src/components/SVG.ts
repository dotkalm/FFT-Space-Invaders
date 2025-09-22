import { TGameBoard } from "../types/index.js";

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
    const startValue = 40;
    const endValue = 470;
    const binsPerRow = Math.floor((endValue - startValue) / gameBoard.length);
    const maxFFTValue = Math.max(...fftData);
    const minFFTValue = Math.min(...fftData);
    for(let i = 0; i < gameBoard.length; i++) {
        updateMakeSVGRowWithPeakDetection({ 
            yOffset,
            svgId,
            binEndIndex: (i + 1) * binsPerRow + startValue,
            binStartIndex: (i * binsPerRow) + startValue,
            binsPerRow,
            fftData,
            rowIndex: i,
            maxFFTValue,
            minFFTValue,
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
    maxFFTValue,
    minFFTValue,
}: {
    binEndIndex: number;
    binStartIndex: number;
    binsPerRow: number;
    fftData: number[];
    rowIndex: number;
    yOffset: number;
    svgId: number;
    maxFFTValue: number;
    minFFTValue: number;
}) => {
    // Your existing path drawing code...
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const className = `peak-${svgId}-row-${rowIndex}`;
    group.setAttribute("class", className);
    const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newPath.setAttribute("id", `row-${rowIndex}`);
    const topOfLine = `${yOffset + (rowIndex * 100) + (minFFTValue + 60)/2}`;
    let path = `M ${100} ${topOfLine}`; // Starting point
    let x = 100;
    const stepWidth = Number((600 / binsPerRow).toFixed(2));

    // Remove old peaks
    const allPeaks = document.getElementsByClassName(`peak-${svgId-1}-row-${rowIndex}`);
    while(allPeaks[0]) {
        allPeaks[0].parentNode?.removeChild(allPeaks[0]);
    }

    // Draw the FFT path
    let lastCircle: number;
    for(let i = binStartIndex; i < binEndIndex; i++) {
        const diffFromMax = Math.abs(230 - fftData[i+2]);
        x += stepWidth;
        const y = (yOffset + (rowIndex * 100)) + (fftData[i+2] / 2);
        path = `${path} L${x.toFixed(2)} ${y.toFixed(2)}`;
        const spacedEnough = !lastCircle || Math.abs(x - lastCircle) > 25;
        if(diffFromMax < 45 && spacedEnough){
            lastCircle = x;
            makeInvader(Number(x.toFixed(2)), Number(y.toFixed(2)), className, group);
        }
    }
    x += stepWidth;
    path = `${path} L${x.toFixed(2)} ${topOfLine}`;

    // Your existing path completion code...
    newPath.setAttribute("d", path);
    //newPath.setAttribute("stroke", "black");
    //newPath.setAttribute("stroke-width", "0.5");
    newPath.setAttribute("fill", "url(#fftGradient)");
    
    if(yOffset > -1){
        const oldPath = document.getElementById(`iteration-${svgId - 1}-row-${rowIndex}`);
        oldPath?.remove();
    }
    newPath.setAttribute("id", `iteration-${svgId}-row-${rowIndex}`);
    group.appendChild(newPath);
    group.setAttribute("id", `group-${svgId}-row-${rowIndex}`);
    document.getElementById("gameBoard")?.appendChild(group);
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

const makeInvader = (x: number, y: number, className: string, group: SVGGElement): void => {
    const invaderPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    invaderPath.setAttribute("d", "M469.344,266.664v-85.328h-42.656v-42.672H384v-21.328h42.688v-64h-64v42.656H320v42.672H192V95.992  h-42.656V53.336h-64v64H128v21.328H85.344v42.672H42.688v85.328H0v149.328h64v-85.328h21.344v85.328H128v42.672h106.688v-64h-85.344  v-21.328h213.344v21.328h-85.344v64H384v-42.672h42.688v-85.328H448v85.328h64V266.664H469.344z M192,245.336h-64v-64h64V245.336z   M384,245.336h-64v-64h64V245.336z");
    invaderPath.setAttribute("fill", "green");
    invaderPath.setAttribute("class", className);
    const originalWidth = 512;
    const targetWidth = 30;
    const scale = targetWidth / originalWidth;

    const innerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    innerGroup.setAttribute("transform", `translate(${x-10}, ${y}) scale(${scale})`);
    innerGroup.setAttribute("class", className);
    innerGroup.appendChild(invaderPath);

    group.appendChild(innerGroup);
}