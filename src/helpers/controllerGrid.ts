import type { TGameBoard } from "../types/index.js";

export const updateControllerGrid = (gameboard: TGameBoard): void => {
    const gridContainer = document.getElementById("controller-grid");
    console.log(gridContainer);
    if (!gridContainer) return;

    gridContainer.innerHTML = ""; // Clear previous cells

    gameboard.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement("div");
            cellDiv.style.gridRow = (rowIndex + 1).toString();
            cellDiv.style.gridColumn = (colIndex + 1).toString();
            cellDiv.style.width = "40px";
            cellDiv.style.height = "40px";
            cellDiv.style.border = "1px solid #ccc";
            cellDiv.style.boxSizing = "border-box";
            cellDiv.setAttribute("id", `cell-${rowIndex}-${colIndex}`);
            if (cell) {
                cellDiv.style.backgroundColor = "green";
                cellDiv.style.cursor = "pointer";
            } else {
                cellDiv.style.backgroundColor = "transparent";
                cellDiv.style.cursor = "default";
            }
            gridContainer.appendChild(cellDiv);
        });
    });
};

export const toggleCell = (): void => {
    const gridContainer = document.getElementById("controller-grid");
    if (!gridContainer) return;

    gridContainer.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target.id.startsWith("cell-")) return;

        const [, rowStr, colStr] = target.id.split("-");
        const rowIndex = Number(rowStr);
        const colIndex = Number(colStr);

        if (isNaN(rowIndex) || isNaN(colIndex)) return;

        // Toggle background color
        if (target.style.backgroundColor === "green") {
            target.style.backgroundColor = "white";
        } else {
            target.style.backgroundColor = "green";
        }
    });
}