import { parseGuideTable } from "./admin-content";

/**
 * Editable-grid operations for the size guide table.
 *
 * Pure functions over `{ headers, rows }`, kept out of the component for two
 * reasons: the component was over the function-length limit, and these are the
 * operations most likely to be wrong at an edge (removing the last column,
 * pasting a ragged table) and are far easier to test than to click through.
 */

export type SizeGuideGridValue = { headers: string[]; rows: string[][] };

export const EMPTY_GUIDE_GRID: SizeGuideGridValue = { headers: [], rows: [] };

export function setHeaderCell(
  grid: SizeGuideGridValue,
  column: number,
  text: string,
): SizeGuideGridValue {
  return { ...grid, headers: grid.headers.map((h, i) => (i === column ? text : h)) };
}

export function setBodyCell(
  grid: SizeGuideGridValue,
  row: number,
  column: number,
  text: string,
): SizeGuideGridValue {
  return {
    ...grid,
    rows: grid.rows.map((cells, r) =>
      r === row ? cells.map((cell, c) => (c === column ? text : cell)) : cells,
    ),
  };
}

export function addGridColumn(grid: SizeGuideGridValue): SizeGuideGridValue {
  return {
    headers: [...grid.headers, ""],
    rows: grid.rows.map((cells) => [...cells, ""]),
  };
}

export function removeGridColumn(grid: SizeGuideGridValue, column: number): SizeGuideGridValue {
  return {
    headers: grid.headers.filter((_, i) => i !== column),
    rows: grid.rows.map((cells) => cells.filter((_, i) => i !== column)),
  };
}

export function addGridRow(grid: SizeGuideGridValue): SizeGuideGridValue {
  return { ...grid, rows: [...grid.rows, grid.headers.map(() => "")] };
}

export function removeGridRow(grid: SizeGuideGridValue, row: number): SizeGuideGridValue {
  return { ...grid, rows: grid.rows.filter((_, i) => i !== row) };
}

/**
 * Whether pasted text is a table or a single value.
 *
 * A spreadsheet copy arrives tab-separated, and often multi-line. A normal
 * paste into a cell has neither, so it is left alone and lands in that cell.
 */
export function looksLikeTable(text: string): boolean {
  return /[\t\n]/.test(text.trim());
}

/**
 * Build a grid from pasted text, or null when the text is not a table.
 *
 * Rows are padded and trimmed to the header width, because a spreadsheet copy
 * very often has a ragged last row and an unpadded grid would render short rows
 * with missing cells.
 */
export function gridFromPaste(text: string): SizeGuideGridValue | null {
  if (!looksLikeTable(text)) return null;
  const parsed = parseGuideTable(text);
  if (parsed.headers.length === 0) return null;

  const width = parsed.headers.length;
  return {
    headers: parsed.headers,
    rows: parsed.rows.map((row) => {
      const cells = row.slice(0, width);
      return [...cells, ...Array<string>(width - cells.length).fill("")];
    }),
  };
}

/**
 * A worked men's-top example, so the owner edits numbers instead of facing an
 * empty grid. Centimetres, garment laid flat, which is the common case for a
 * first shop and closer to right than nothing.
 */
export function clothingTemplateGrid(labels: {
  size: string;
  chest: string;
  waist: string;
  length: string;
}): SizeGuideGridValue {
  return {
    headers: [labels.size, labels.chest, labels.waist, labels.length],
    rows: [
      ["S", "96", "80", "68"],
      ["M", "100", "84", "70"],
      ["L", "104", "88", "72"],
      ["XL", "108", "92", "74"],
    ],
  };
}
