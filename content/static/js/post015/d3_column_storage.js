const config = {
  tableRows: 4,
  tableCols: 3,
  cellSize: 50,
  spacing: 10,
  rowGroupSize: 2,

  tableStartX: 100,
  tableStartY: 50,

  storageStartX: 400,
  storageStartY: 50,
  storageWrap: 7,  // how many cells per row in wrapped layout

  colors: d3.schemeTableau10
};

config.tableWidth = config.tableCols * config.cellSize + (config.tableCols - 1) * config.spacing;
config.storageWidth = config.storageWrap * (config.cellSize + config.spacing);
config.cellsPerRG = config.rowGroupSize * config.tableCols;
config.numRG = Math.ceil(config.tableRows / config.rowGroupSize);

let inStorageView = false;

function writeSectionHeaders(svg, storage_title) {
  const headerOffset = 20

  svg.append("text")
    .attr("class", "section-title")
    .attr("x", config.tableStartX + config.tableWidth / 2)
    .attr("y", config.tableStartY - headerOffset)
    .text("Table");

  svg.append("text")
    .attr("class", "section-title")
    .attr("x", config.storageStartX + config.storageWidth / 2) 
    .attr("y", config.storageStartY - headerOffset)
    .text(storage_title);
}

function writeRowGroupHeaders(svg) {
  for (let rg = 0; rg < config.numRG; rg++) {
    svg.append("text")
      .attr("class", "section-subtitle")
      .attr("x", config.storageStartX - 50)
      .attr("y", config.storageStartY + rg * (config.cellSize + config.spacing * 1.5) + 30)
      .text(`Row Group ${rg}`);
  }

}


function drawGhosts(svg) {
  // Add ghost table grid (always visible)
  for (let r = 0; r < config.tableRows; r++) {
    for (let c = 0; c < config.tableCols; c++) {
      svg.append("rect")
        .attr("class", "ghost")
        .attr("x", config.tableStartX + c * (config.cellSize + config.spacing))
        .attr("y", config.tableStartY + r * (config.cellSize + config.spacing))
        .attr("width", config.cellSize)
        .attr("height", config.cellSize);

      svg.append("text")
        .attr("class", "ghost")
        .attr("x", config.tableStartX + c * (config.cellSize + config.spacing) + config.cellSize / 2)
        .attr("y", config.tableStartY + r * (config.cellSize + config.spacing) + config.cellSize / 2 + 5)
        .text(`R${r}C${c}`)
        .attr("text-anchor", "middle");
    }
  }

  // Add ghost storage disk (always visible)
  for (let r=0; r < 2; r++) {
    svg.append("rect")
      .attr("class", "ghost")
      .attr("x", config.storageStartX)
      .attr("y", config.storageStartY + r * (config.cellSize + config.spacing * 1.5))
      .attr("width", config.storageWidth)
      .attr("height", config.cellSize);
  }
}


function createCells(svg) {
  const data = [];

  for (let r = 0; r < config.tableRows; r++) {
    for (let c = 0; c < config.tableCols; c++) {
      data.push({
        id: `R${r}C${c}`,
        row: r,
        col: c,
        label: `R${r}C${c}`,
        color: config.colors[c % config.colors.length]
      });
    }
  }

  const cells = svg.selectAll(".cell")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", d => config.tableStartX + d.col * (config.cellSize + config.spacing))
    .attr("y", d => config.tableStartY + d.row * (config.cellSize + config.spacing))
    .attr("width", config.cellSize)
    .attr("height", config.cellSize)
    .attr("fill", d => d.color);

  const labels = svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => config.tableStartX + d.col * (config.cellSize + config.spacing) + config.cellSize / 2)
    .attr("y", d => config.tableStartY + d.row * (config.cellSize + config.spacing) + config.cellSize / 2 + 5)
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

function getIndex(d, type) {
  if (type === "row") return d.row * config.tableCols + d.col;
  if (type === "column") return d.col * config.tableRows + d.row;
  if (type === "hybrid") return d.row % config.rowGroupSize + d.col * config.rowGroupSize + Math.floor(d.row / config.rowGroupSize) * config.rowGroupSize * config.tableCols;
}

function getStorageWrap(type) {
  if (type === "hybrid") {
    return config.cellsPerRG;
  } else {
    return config.storageWrap;
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
        return config.tableStartX + d.col * (config.cellSize + config.spacing);
      } else {
        return config.storageStartX + (getIndex(d, type) % getStorageWrap(type)) * (config.cellSize + config.spacing)
      }
    })
    .attr("y", d => {
      if (!toStorage) {
        return config.tableStartY + d.row * (config.cellSize + config.spacing);
      } else {
        return config.storageStartY + Math.floor(getIndex(d, type) / getStorageWrap(type)) * (config.cellSize + config.spacing * 1.5);
      }
    })

  svg.selectAll(".label")
    .transition()
    .duration(duration)
    .delay(d => getIndex(d, type) * 50)
    .attr("x", d => {
      if (!toStorage) {
        return config.tableStartX + d.col * (config.cellSize + config.spacing) + config.cellSize / 2;
      } else {
        return config.storageStartX + (getIndex(d, type) % getStorageWrap(type)) * (config.cellSize + config.spacing) + config.cellSize / 2;
      }
    })
    .attr("y", d => {
      if (!toStorage) {
        return config.tableStartY + d.row * (config.cellSize + config.spacing) + config.cellSize / 2 + 5;
      } else {
        return config.storageStartY + Math.floor(getIndex(d, type) / getStorageWrap(type)) * (config.cellSize + config.spacing * 1.5) + config.cellSize / 2 + 5;
      }
    })
}

function toggleAllViz() {
  inStorageView = !inStorageView;
  transitionViz("row", inStorageView)
  transitionViz("column", inStorageView)
  transitionViz("hybrid", inStorageView)
}

createRowViz()
createColumnViz()
createHybridViz()

document.getElementById("play-0").addEventListener("click", toggleAllViz);
document.getElementById("play-1").addEventListener("click", toggleAllViz);
