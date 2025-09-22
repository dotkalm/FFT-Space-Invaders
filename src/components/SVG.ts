import { TGameBoard } from "../types/index.js";
import { SETTINGS } from "../constants/index.js";

type TMakeRowParams = {
    binEndIndex: number;
    binStartIndex: number;
    binsPerRow: number;
    fftData: number[];
    rowIndex: number;
    yOffset: number;
    svgId: number;
}
export const makeSVGRow = ({ 
    binEndIndex,
    binStartIndex,
    binsPerRow,
    fftData,
    rowIndex,
    yOffset,
    svgId,
}: TMakeRowParams): void => {
    const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newPath.setAttribute("id", `row-${rowIndex}`);
    let path = `M 0 ${yOffset + (rowIndex * 100)}`;
    let x = 0;
    const stepWidth = Number((SETTINGS.PIXEL_WIDTH / binsPerRow).toFixed(2));
    let previousValue = 0;
    let peakCount = 0;
    const allPeaks = document.getElementsByClassName(`peak-${svgId-1}-row-${rowIndex}`);
    while(allPeaks[0]) {
        allPeaks[0].parentNode?.removeChild(allPeaks[0]);
    }
    for(let i = binStartIndex; i < binEndIndex; i++) {
        const currentValue = fftData[i];
        const nextValue = fftData[i + 1];
        if(previousValue < currentValue && currentValue >= nextValue) {
            peakCount++;
            // Peak detected
            makeDebugLabels({
                currentValue,
                i,
                rowIndex,
                svgId,
                yOffset,
                peakCount,
                x,
            });
        }
        x += stepWidth;
        const y = (yOffset + (rowIndex * 100)) + (fftData[i] / 2);
        path = `${path} L${x.toFixed(2)} ${y.toFixed(2)}`;
        previousValue = fftData[i];
    }
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
        makeSVGRow({ 
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