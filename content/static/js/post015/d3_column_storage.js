const svg = d3.select("#viz-column");
const width = +svg.attr("width");
const height = +svg.attr("height");

const tableRows = 4;
const tableCols = 3;
const cellSize = 50;
const spacing = 10;

const tableStartX = 100;
const tableStartY = 100;

const storageStartX = 400;
const storageStartY = 100;
const storageWrap = 7;  // how many cells per row in wrapped layout

const colors = d3.schemeTableau10;

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

// Add section headers
svg.append("text")
  .attr("class", "section-title")
  .attr("x", tableStartX + (tableCols * (cellSize + spacing)) / 2)
  .attr("y", tableStartY - 50)
  .text("Table");

svg.append("text")
  .attr("class", "section-title")
  .attr("x", storageStartX + cellSize * 3)
  .attr("y", storageStartY - 50)
  .text("Column Storage");

// Add ghost table grid (always visible)
for (let r = 0; r < tableRows; r++) {
  for (let c = 0; c < tableCols; c++) {
    svg.append("rect")
      .attr("class", "ghost")
      .attr("x", tableStartX + c * (cellSize + spacing))
      .attr("y", tableStartY + r * (cellSize + spacing))
      .attr("width", cellSize)
      .attr("height", cellSize);
  }
}

// Add ghost storage disk (always visible)
for (let r=0; r < 2; r++) {
  svg.append("rect")
    .attr("class", "ghost")
    .attr("x", storageStartX)
    .attr("y", storageStartY + r * (cellSize + spacing * 1.5))
    .attr("width", storageWrap * (cellSize + spacing))
    .attr("height", cellSize);
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

let inStorageView = false;

svg.on("click", () => {
  inStorageView = !inStorageView;

  if (inStorageView) {
    // Animate to columnar storage (column-major order)
    cells.transition()
      .duration(1000)
      .delay((d, i) => (d.col * tableRows + d.row) * 50)
      .attr("x", d => {
        const index = d.col * tableRows + d.row;
        const xOffset = index % storageWrap;
        return storageStartX + xOffset * (cellSize + spacing);
      })
      .attr("y", d => {
        const index = d.col * tableRows + d.row;
        const yOffset = Math.floor(index / storageWrap);
        return storageStartY + yOffset * (cellSize + spacing * 1.5);
      });

    labels.transition()
      .duration(1000)
      .delay((d, i) => (d.col * tableRows + d.row) * 50)
      .attr("x", d => {
        const index = d.col * tableRows + d.row;
        const xOffset = index % storageWrap;
        return storageStartX + xOffset * (cellSize + spacing) + cellSize / 2;
      })
      .attr("y", d => {
        const index = d.col * tableRows + d.row;
        const yOffset = Math.floor(index / storageWrap);
        return storageStartY + yOffset * (cellSize + spacing * 1.5) + cellSize / 2 + 5;
      });
  } else {
    // Animate back to table view
    cells.transition()
      .duration(1000)
      .delay((d, i) => (d.col * tableRows + d.row) * 50)
      .attr("x", d => tableStartX + d.col * (cellSize + spacing))
      .attr("y", d => tableStartY + d.row * (cellSize + spacing));

    labels.transition()
      .duration(1000)
      .delay((d, i) => (d.col * tableRows + d.row) * 50)
      .attr("x", d => tableStartX + d.col * (cellSize + spacing) + cellSize / 2)
      .attr("y", d => tableStartY + d.row * (cellSize + spacing) + cellSize / 2 + 5);
  }
});
