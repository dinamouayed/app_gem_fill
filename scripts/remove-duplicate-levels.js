#!/usr/bin/env node
/**
 * Remove levels with identical silhouettes and renumber the catalog sequentially.
 * Run from repo root: node scripts/remove-duplicate-levels.js
 */

const fs = require('fs');
const path = require('path');

const LEVELS_DIR = path.join(__dirname, '../src/data/levels');
const MASK_THRESHOLD = 0.975;

function listLevelIds() {
  return fs
    .readdirSync(LEVELS_DIR)
    .map((file) => {
      const match = file.match(/^level(\d+)\.ts$/);
      return match ? Number.parseInt(match[1], 10) : null;
    })
    .filter((id) => id !== null)
    .sort((a, b) => a - b);
}

function loadGrid(levelId) {
  const content = fs.readFileSync(
    path.join(LEVELS_DIR, `level${levelId}.ts`),
    'utf8',
  );
  const gridMatch = content.match(
    /targetGrid:\s*(\[[\s\S]*?\])\s*,?\s*\}|\s*"targetGrid":\s*(\[[\s\S]*?\])\s*\}/,
  );
  return eval(gridMatch[1] || gridMatch[2]);
}

function getBackground(grid) {
  const counts = {};
  for (const cell of grid.flat()) {
    counts[cell] = (counts[cell] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function maskKey(grid) {
  const bg = getBackground(grid);
  return grid.map((row) => row.map((cell) => (cell === bg ? '0' : '1')).join('')).join('|');
}

function maskSimilarity(a, b) {
  if (a.length !== b.length || a[0].length !== b[0].length) return 0;
  const bgA = getBackground(a);
  const bgB = getBackground(b);
  let same = 0;
  let total = 0;
  for (let row = 0; row < a.length; row++) {
    for (let col = 0; col < a[row].length; col++) {
      total++;
      if ((a[row][col] !== bgA) === (b[row][col] !== bgB)) same++;
    }
  }
  return same / total;
}

function readLevelFile(levelId) {
  return fs.readFileSync(path.join(LEVELS_DIR, `level${levelId}.ts`), 'utf8');
}

function writeLevelFile(levelId, content) {
  const updated = content
    .replace(/export const level\d+/, `export const level${levelId}`)
    .replace(/"id":\s*\d+/, `"id": ${levelId}`)
    .replace(/\bid:\s*\d+/, `id: ${levelId}`);

  fs.writeFileSync(path.join(LEVELS_DIR, `level${levelId}.ts`), updated, 'utf8');
}

function findDuplicateIds(levelIds) {
  const grids = new Map(
    levelIds.map((id) => [id, { id, grid: loadGrid(id) }]),
  );

  const removeIds = new Set();
  const keptIds = [];

  for (const id of levelIds) {
    const entry = grids.get(id);
    let matchedId = null;

    for (const keptId of keptIds) {
      const keptEntry = grids.get(keptId);
      if (keptEntry.grid.length !== entry.grid.length) continue;
      if (keptEntry.grid[0].length !== entry.grid[0].length) continue;

      const sameMask = maskKey(entry.grid) === maskKey(keptEntry.grid);
      const similarity = maskSimilarity(entry.grid, keptEntry.grid);
      if (sameMask || similarity >= MASK_THRESHOLD) {
        matchedId = keptId;
        break;
      }
    }

    if (matchedId) {
      removeIds.add(id);
      const keptEntry = grids.get(matchedId);
      const similarity = maskSimilarity(entry.grid, keptEntry.grid);
      console.log(
        `Duplicate silhouette: #${id} ≈ #${matchedId} (${(similarity * 100).toFixed(1)}%)`,
      );
      continue;
    }

    keptIds.push(id);
  }

  return removeIds;
}

const levelIds = listLevelIds();
const removeIds = findDuplicateIds(levelIds);
const keptIds = levelIds.filter((id) => !removeIds.has(id));

if (removeIds.size === 0) {
  console.log('No duplicate levels found.');
  process.exit(0);
}

console.log(`Removing ${removeIds.size} level(s): ${[...removeIds].join(', ')}`);
console.log(`Keeping ${keptIds.length} levels`);

for (const removeId of removeIds) {
  fs.unlinkSync(path.join(LEVELS_DIR, `level${removeId}.ts`));
}

const tempDir = path.join(LEVELS_DIR, '.renumber-temp');
fs.mkdirSync(tempDir, { recursive: true });

for (let index = 0; index < keptIds.length; index++) {
  const oldId = keptIds[index];
  const newId = index + 1;
  fs.writeFileSync(
    path.join(tempDir, `level${newId}.ts`),
    readLevelFile(oldId),
    'utf8',
  );
}

for (const oldId of listLevelIds()) {
  fs.unlinkSync(path.join(LEVELS_DIR, `level${oldId}.ts`));
}

for (let newId = 1; newId <= keptIds.length; newId++) {
  const content = fs.readFileSync(path.join(tempDir, `level${newId}.ts`), 'utf8');
  writeLevelFile(newId, content);
}

fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`Renumbered ${keptIds.length} levels (1-${keptIds.length})`);
console.log('Run: npm run sync-levels-index');
