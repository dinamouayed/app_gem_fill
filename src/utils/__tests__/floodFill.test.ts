import { describe, it } from "vitest";
import assert from "node:assert";

import {
  getConnectedGemGroup,
  moveGroupToReserve,
  moveGroupToBoard,
  moveReserveGroupToBoard,
} from "../floodFill";

describe("Flood Fill & Connected Group Selection Tests", () => {
  it("1. Une gemme isolée retourne un groupe de taille 1", () => {
    const grid = [
      ["R", null, "B"],
      [null, "G", null],
      ["Y", null, "R"],
    ];

    const group = getConnectedGemGroup(grid, { row: 1, col: 1 });
    assert.strictEqual(group.length, 1);
    assert.deepStrictEqual(group[0], { row: 1, col: 1 });
  });

  it("2. Deux gemmes de même couleur côte à côte sont sélectionnées", () => {
    const grid = [
      ["R", "R", "B"],
      [null, "G", null],
    ];

    const group = getConnectedGemGroup(grid, { row: 0, col: 0 });
    assert.strictEqual(group.length, 2);
    assert.deepStrictEqual(group, [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
  });

  it("3. Une chaîne de plusieurs gemmes est entièrement sélectionnée", () => {
    const grid = [
      ["R", "R", "R"],
      [null, null, "R"],
      ["B", "R", "R"],
    ];

    const group = getConnectedGemGroup(grid, { row: 0, col: 0 });
    assert.strictEqual(group.length, 6);
  });

  it("4. Deux groupes de même couleur séparés ne sont pas sélectionnés ensemble", () => {
    const grid = [
      ["Y", "Y", "W", "Y", "Y"],
      ["W", "W", "W", "W", "W"],
    ];

    const groupLeft = getConnectedGemGroup(grid, { row: 0, col: 0 });
    assert.strictEqual(groupLeft.length, 2);
    assert.deepStrictEqual(groupLeft, [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
  });

  it("5. Les gemmes reliées en diagonale sont sélectionnées", () => {
    const grid = [
      ["R", "B", "R"],
      ["B", "R", "B"],
      ["R", "B", "R"],
    ];

    const groupCenter = getConnectedGemGroup(grid, {
      row: 1,
      col: 1,
    });

    assert.strictEqual(groupCenter.length, 5);

    assert.deepStrictEqual(groupCenter, [
      { row: 1, col: 1 },
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ]);
  });

  it("6. Un groupe situé au bord de la grille ne provoque pas d’erreur", () => {
    const grid = [
      ["G", "G"],
      ["G", "B"],
    ];

    const groupTopLeft = getConnectedGemGroup(grid, { row: 0, col: 0 });
    assert.strictEqual(groupTopLeft.length, 3);
  });

  it("7, 8, 9, 10. Groupe plus grand que la réserve déplacé partiellement & intégrité des gemmes", () => {
    const grid = [
      ["R", "R", "R"],
      ["R", "R", "R"],
      [null, null, null],
    ];
    const reserve = [null, null, null, null]; // Capacité 4

    const selectedPositions = getConnectedGemGroup(grid, { row: 0, col: 0 }); // 6 gemmes R
    assert.strictEqual(selectedPositions.length, 6);

    const result = moveGroupToReserve(grid, reserve, selectedPositions);

    // 4 gemmes en réserve
    assert.strictEqual(result.movedGemIds.length, 4);
    assert.strictEqual(result.nextReserve.filter((s) => s === "R").length, 4);

    // 2 gemmes restantes en sélection et sur la grille (selon l'ordre BFS)
    assert.strictEqual(result.remainingSelectedPositions.length, 2);
    assert.deepStrictEqual(result.remainingSelectedPositions, [
      { row: 0, col: 2 },
      { row: 1, col: 2 },
    ]);

    // Les 2 gemmes restent à leurs positions initiales sur la grille
    assert.strictEqual(result.nextGrid[0][2], "R");
    assert.strictEqual(result.nextGrid[1][2], "R");

    // Total gemmes R inchangé (4 en réserve + 2 sur grille = 6)
    const reserveR = result.nextReserve.filter((x) => x === "R").length;
    const gridR = result.nextGrid.flat().filter((x) => x === "R").length;
    assert.strictEqual(reserveR + gridR, 6);
  });

  it("Déplacement de groupe vers le plateau", () => {
    const grid = [
      ["B", "B", null],
      [null, null, null],
    ];
    const targetGrid = [
      ["B", "B", "B"],
      ["B", "B", "B"],
    ];

    const selected = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    const destination = { row: 0, col: 2 };

    const result = moveGroupToBoard(grid, targetGrid, selected, destination);

    assert.strictEqual(result.movedGemIds.length, 2);
    assert.strictEqual(result.remainingSelectedPositions.length, 0);
    assert.strictEqual(result.nextGrid[0][2], "B");
    assert.strictEqual(result.nextGrid[1][2], "B");
  });

  it("Déplacement de plusieurs gemmes de la réserve vers le plateau", () => {
    const grid = [[null, null, null]];
    const targetGrid = [["B", "B", "B"]];
    const reserve = ["B", "B", "B", "R", null, null, null, null, null, null];

    const result = moveReserveGroupToBoard(
      grid,
      targetGrid,
      reserve,
      { row: 0, col: 0 },
      "B",
    );

    assert.strictEqual(result.placedCount, 3);
    assert.strictEqual(result.nextGrid.flat().filter((gemId) => gemId === "B").length, 3);
    assert.strictEqual(
      result.nextReserve.filter((gemId) => gemId === "B").length,
      0,
    );
  });
});
