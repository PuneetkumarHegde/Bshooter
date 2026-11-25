/**
 * hexGrid.js — Offset (staggered) grid geometry for the bubble board.
 *
 * We use a classic offset grid: even rows are flush-left, odd rows are shifted
 * right by one radius. This produces the natural, close-packed arrangement a
 * bubble shooter needs (spec §16). All math is in LOGICAL units (radius `r`);
 * the renderer scales logical → canvas pixels.
 *
 * A "cell" is addressed by { row, col }. A row's valid column count alternates:
 *   even row -> `cols`     columns (0 .. cols-1)
 *   odd  row -> `cols - 1` columns (0 .. cols-2)
 */

export function cellKey(row, col) {
  return `${row},${col}`;
}

export function parseKey(key) {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

/** Number of columns in a given row. */
export function colsInRow(row, cols) {
  return row % 2 === 0 ? cols : cols - 1;
}

/** Is (row,col) a valid cell within the board bounds? */
export function isValidCell(row, col, cols, maxRows) {
  if (row < 0 || col < 0) return false;
  if (maxRows != null && row >= maxRows) return false;
  return col < colsInRow(row, cols);
}

/** Logical pixel center of a cell. */
export function cellToPixel(row, col, r) {
  const d = r * 2;
  const rowHeight = r * Math.sqrt(3);
  const offset = row % 2 === 0 ? r : d; // even rows start at r, odd rows at 2r
  const x = offset + col * d;
  const y = r + row * rowHeight;
  return { x, y };
}

/** Nearest cell to a logical pixel position. */
export function pixelToCell(x, y, r, cols) {
  const d = r * 2;
  const rowHeight = r * Math.sqrt(3);
  let row = Math.round((y - r) / rowHeight);
  if (row < 0) row = 0;
  const offset = row % 2 === 0 ? r : d;
  let col = Math.round((x - offset) / d);
  const maxCol = colsInRow(row, cols) - 1;
  if (col < 0) col = 0;
  if (col > maxCol) col = maxCol;
  return { row, col };
}

/**
 * The six neighbors of a cell in the offset grid.
 * The up/down diagonal targets depend on row parity.
 */
export function neighbors(row, col, cols, maxRows) {
  const even = row % 2 === 0;
  const candidates = even
    ? [
        [row, col - 1],
        [row, col + 1],
        [row - 1, col - 1],
        [row - 1, col],
        [row + 1, col - 1],
        [row + 1, col],
      ]
    : [
        [row, col - 1],
        [row, col + 1],
        [row - 1, col],
        [row - 1, col + 1],
        [row + 1, col],
        [row + 1, col + 1],
      ];
  return candidates.filter(([r2, c2]) => isValidCell(r2, c2, cols, maxRows));
}

/** Total logical width of the board (used to derive the render scale). */
export function boardWidth(cols, r) {
  return cols * r * 2;
}

/** Logical height needed to show `rows` rows. */
export function boardHeight(rows, r) {
  const rowHeight = r * Math.sqrt(3);
  return r + rows * rowHeight + r;
}
