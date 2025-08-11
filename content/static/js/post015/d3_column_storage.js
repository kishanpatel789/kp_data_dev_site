const tableRows = 4;
const tableCols = 3;
const cellSize = 50;
const spacing = 10;
const rowGroupSize = 2

const tableStartX = 100;
const tableStartY = 50;

const storageStartX = 400;
const storageStartY = 50;
const storageWrap = 7;  // how many cells per row in wrapped layout

const tableWidth = tableCols * cellSize + (tableCols - 1) * spacing;
const storageWidth = storageWrap * (cellSize + spacing);
const cellsPerRG = rowGroupSize * tableCols;
const numRG = Math.ceil(tableRows / rowGroupSize);

const colors = d3.schemeTableau10;


let inStorageView = false;

function writeSectionHeaders(svg, storage_title) {
  const headerOffset = 20

  // Add section headers
  svg.append("text")
    .attr("class", "section-title")
    .attr("x", tableStartX + tableWidth / 2)
    .attr("y", tableStartY - headerOffset)
    .text("Table");

  svg.append("text")
    .attr("class", "section-title")
    .attr("x", storageStartX + storageWidth / 2) 
    .attr("y", storageStartY - headerOffset)
    .text(storage_title);
}

function writeRowGroupHeaders(svg) {
  for (let rg = 0; rg < numRG; rg++) {
    svg.append("text")
      .attr("class", "section-subtitle")
      .attr("x", storageStartX - 50)
      .attr("y", storageStartY + rg * (cellSize + spacing * 1.5) + 30)
      .text(`Row Group ${rg}`);
  }

}


function drawGhosts(svg) {
  // Add ghost table grid (always visible)
  for (let r = 0; r < tableRows; r++) {
    for (let c = 0; c < tableCols; c++) {
      svg.append("rect")
        .attr("class", "ghost")
        .attr("x", tableStartX + c * (cellSize + spacing))
        .attr("y", tableStartY + r * (cellSize + spacing))
        .attr("width", cellSize)
        .attr("height", cellSize);

      svg.append("text")
        .attr("class", "ghost")
        .attr("x", tableStartX + c * (cellSize + spacing) + cellSize / 2)
        .attr("y", tableStartY + r * (cellSize + spacing) + cellSize / 2 + 5)
        .text(`R${r}C${c}`)
        .attr("text-anchor", "middle");
    }
  }

  // Add ghost storage disk (always visible)
  for (let r=0; r < 2; r++) {
    svg.append("rect")
      .attr("class", "ghost")
      .attr("x", storageStartX)
      .attr("y", storageStartY + r * (cellSize + spacing * 1.5))
      .attr("width", storageWidth)
      .attr("height", cellSize);
  }
}


function createCells(svg) {
  const data = [];

  for (let r = 0; r < tableRows; r++) {
    for (let c = 0; c < tableCols; c++) {
      data.push({
        id: `R${r}C${c}`,
        row: r,
        col: c,
        label: `R${r}C${c}`,
        color: colors[c % colors.length]
      });
    }
  }

  // Main cells
  const cells = svg.selectAll(".cell")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", d => tableStartX + d.col * (cellSize + spacing))
    .attr("y", d => tableStartY + d.row * (cellSize + spacing))
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("fill", d => d.color);

  const labels = svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => tableStartX + d.col * (cellSize + spacing) + cellSize / 2)
    .attr("y", d => tableStartY + d.row * (cellSize + spacing) + cellSize / 2 + 5)
    .text(d => d.label)
    .attr("text-anchor", "middle");
}

function createRowViz() {
  const svg = d3.select("#viz-row");
  writeSectionHeaders(svg, "Row Storage (on disk)");
  drawGhosts(svg);
  createCells(svg);
}

function createColumnViz() {
  const svg = d3.select("#viz-column");
  writeSectionHeaders(svg, "Column Storage (on disk)");
  drawGhosts(svg);
  createCells(svg);
}

function createHybridViz() {
  const svg = d3.select("#viz-hybrid");
  writeSectionHeaders(svg, "Hybrid Storage");
  drawGhosts(svg);
  createCells(svg);
  writeRowGroupHeaders(svg);
}

createRowViz()
createColumnViz()
createHybridViz()

function toggleAllViz() {
  inStorageView = !inStorageView;
  transitionViz("row", inStorageView)
  transitionViz("column", inStorageView)
  transitionViz("hybrid", inStorageView)
}

function getIndex(d, type) {
  if (type === "row") return d.row * tableCols + d.col;
  if (type === "column") return d.col * tableRows + d.row;
  if (type === "hybrid") return d.row % rowGroupSize + d.col * rowGroupSize + Math.floor(d.row / rowGroupSize) * rowGroupSize * tableCols;
}

function getStorageWrap(type) {
  if (type === "hybrid") {
    return cellsPerRG;
  } else {
    return storageWrap;
  }
}

function transitionViz(type, toStorage) {
  const svg = d3.select(`#viz-${type}`)
  const cells = svg.selectAll(".cell")
  const labels = svg.selectAll(".label")
  const duration = 1000

  svg.selectAll(".cell")
    .transition()
    .duration(duration)
    .delay(d => getIndex(d, type) * 50)
    .attr("x", d => {
      if (!toStorage) {
        return tableStartX + d.col * (cellSize + spacing);
      } else {
        return storageStartX + (getIndex(d, type) % getStorageWrap(type)) * (cellSize + spacing)
      }
    })
    .attr("y", d => {
      if (!toStorage) {
        return tableStartY + d.row * (cellSize + spacing);
      } else {
        return storageStartY + Math.floor(getIndex(d, type) / getStorageWrap(type)) * (cellSize + spacing * 1.5);
      }
    })

  svg.selectAll(".label")
    .transition()
    .duration(duration)
    .delay(d => getIndex(d, type) * 50)
    .attr("x", d => {
      if (!toStorage) {
        return tableStartX + d.col * (cellSize + spacing) + cellSize / 2;
      } else {
        return storageStartX + (getIndex(d, type) % getStorageWrap(type)) * (cellSize + spacing) + cellSize / 2;
      }
    })
    .attr("y", d => {
      if (!toStorage) {
        return tableStartY + d.row * (cellSize + spacing) + cellSize / 2 + 5;
      } else {
        return storageStartY + Math.floor(getIndex(d, type) / getStorageWrap(type)) * (cellSize + spacing * 1.5) + cellSize / 2 + 5;
      }
    })
}

document.getElementById("play-0").addEventListener("click", toggleAllViz);
document.getElementById("play-1").addEventListener("click", toggleAllViz);
