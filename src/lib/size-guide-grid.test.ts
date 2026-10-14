import { describe, expect, it } from "vitest";
import {
  addGridColumn,
  addGridRow,
  gridFromPaste,
  looksLikeTable,
  removeGridColumn,
  removeGridRow,
  setBodyCell,
  setHeaderCell,
  type SizeGuideGridValue,
} from "./size-guide-grid";

const GRID: SizeGuideGridValue = {
  headers: ["Size", "Chest", "Length"],
  rows: [
    ["S", "96", "68"],
    ["M", "100", "70"],
  ],
};

describe("cell editing", () => {
  it("edits a header without touching the rows", () => {
    const next = setHeaderCell(GRID, 1, "Chest (cm)");
    expect(next.headers).toEqual(["Size", "Chest (cm)", "Length"]);
    expect(next.rows).toEqual(GRID.rows);
  });

  it("edits one body cell and leaves the rest alone", () => {
    const next = setBodyCell(GRID, 1, 2, "72");
    expect(next.rows[1]).toEqual(["M", "100", "72"]);
    expect(next.rows[0]).toEqual(["S", "96", "68"]);
  });

  it("does not mutate the grid it was given", () => {
    const before = structuredClone(GRID);
    setBodyCell(GRID, 0, 0, "XXL");
    setHeaderCell(GRID, 0, "Taille");
    expect(GRID).toEqual(before);
  });
});

describe("rows and columns", () => {
  it("adds a column with a cell for every existing row", () => {
    const next = addGridColumn(GRID);
    expect(next.headers).toHaveLength(4);
    expect(next.rows.every((row) => row.length === 4)).toBe(true);
  });

  it("adds a row with a cell for every existing column", () => {
    const next = addGridRow(GRID);
    expect(next.rows).toHaveLength(3);
    expect(next.rows[2]).toHaveLength(3);
  });

  it("removing a column keeps the remaining cells aligned", () => {
    const next = removeGridColumn(GRID, 1);
    expect(next.headers).toEqual(["Size", "Length"]);
    // The chest values must go with the chest column, not be shifted along.
    expect(next.rows[0]).toEqual(["S", "68"]);
  });

  it("can remove the last column, leaving an empty grid", () => {
    let next = removeGridColumn(GRID, 2);
    next = removeGridColumn(next, 1);
    next = removeGridColumn(next, 0);
    expect(next.headers).toEqual([]);
    expect(next.rows).toEqual([[], []]);
  });

  it("removes the row that was asked for", () => {
    expect(removeGridRow(GRID, 0).rows).toEqual([["M", "100", "70"]]);
  });
});

describe("paste detection", () => {
  it("treats single values as normal cell input", () => {
    expect(looksLikeTable("100")).toBe(false);
    expect(looksLikeTable("M")).toBe(false);
    expect(gridFromPaste("100")).toBeNull();
  });

  it("treats a tab or newline as a table", () => {
    expect(looksLikeTable("Size\tChest")).toBe(true);
    expect(looksLikeTable("Size\nChest")).toBe(true);
  });
});

describe("gridFromPaste", () => {
  it("builds a grid from a spreadsheet copy", () => {
    const grid = gridFromPaste("Size\tChest\tLength\nS\t96\t68\nM\t100\t70");
    expect(grid).toEqual(GRID);
  });

  it("accepts a comma-separated copy too", () => {
    const grid = gridFromPaste("Size,Chest\nS,96");
    expect(grid).toEqual({ headers: ["Size", "Chest"], rows: [["S", "96"]] });
  });

  it("pads a ragged spreadsheet copy to the header width", () => {
    // A copy with a trailing empty cell is common, and an unpadded grid renders
    // short rows with missing inputs.
    const grid = gridFromPaste("Size\tChest\tLength\nS\t96");
    expect(grid!.rows[0]).toEqual(["S", "96", ""]);
  });

  it("drops cells beyond the header width rather than inventing a column", () => {
    const grid = gridFromPaste("Size\tChest\nS\t96\t68");
    expect(grid!.rows[0]).toEqual(["S", "96"]);
  });

  it("ignores trailing blank lines", () => {
    const grid = gridFromPaste("Size\tChest\nS\t96\n\n");
    expect(grid!.rows).toHaveLength(1);
  });
});
