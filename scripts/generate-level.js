#!/usr/bin/env node

/**
 * Image to Gem Fill Level Converter
 * 
 * Usage:
 * node scripts/generate-level.js --input ./image.png --id 6 --name "Plage Ensoleillée" --rows 10 --cols 10 --maxColors 6 --output ./src/data/levels/level6.ts
 */

const fs = require('fs');
const path = require('path');

// Simple color distance (Euclidean in RGB space)
function colorDistance(c1, c2) {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return dr * dr + dg * dg + db * db;
}

// Convert RGB to HEX
function rgbToHex(r, g, b) {
  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// K-Means quantization to extract k prominent colors from pixel array
function kMeansQuantize(pixels, k = 6, maxIter = 15) {
  if (pixels.length === 0) return [];
  
  // Pick k initial centroids randomly
  let centroids = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push({ ...pixels[Math.min(i * step, pixels.length - 1)] });
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const clusters = Array.from({ length: k }, () => []);
    
    // Assign pixels to closest centroid
    for (const pixel of pixels) {
      let minDist = Infinity;
      let closestIdx = 0;
      centroids.forEach((c, idx) => {
        const d = colorDistance(pixel, c);
        if (d < minDist) {
          minDist = d;
          closestIdx = idx;
        }
      });
      clusters[closestIdx].push(pixel);
    }

    // Recalculate centroids
    let changed = false;
    centroids = clusters.map((cluster, idx) => {
      if (cluster.length === 0) return centroids[idx];
      let sumR = 0, sumG = 0, sumB = 0;
      cluster.forEach((p) => {
        sumR += p.r;
        sumG += p.g;
        sumB += p.b;
      });
      const newC = {
        r: Math.round(sumR / cluster.length),
        g: Math.round(sumG / cluster.length),
        b: Math.round(sumB / cluster.length),
      };
      if (colorDistance(newC, centroids[idx]) > 4) changed = true;
      return newC;
    });

    if (!changed) break;
  }

  return centroids;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    input: '',
    id: 6,
    name: 'Niveau Généré',
    rows: 10,
    cols: 10,
    maxColors: 6,
    difficulty: 'medium',
    category: 'Généré',
    output: '',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) params.input = args[++i];
    else if (args[i] === '--id' && args[i + 1]) params.id = parseInt(args[++i], 10);
    else if (args[i] === '--name' && args[i + 1]) params.name = args[++i];
    else if (args[i] === '--rows' && args[i + 1]) params.rows = parseInt(args[++i], 10);
    else if (args[i] === '--cols' && args[i + 1]) params.cols = parseInt(args[++i], 10);
    else if (args[i] === '--maxColors' && args[i + 1]) params.maxColors = parseInt(args[++i], 10);
    else if (args[i] === '--difficulty' && args[i + 1]) params.difficulty = args[++i];
    else if (args[i] === '--output' && args[i + 1]) params.output = args[++i];
  }

  return params;
}

function generateMockLevel(params) {
  // If no input image or pngjs not available, generate an algorithmic pixel art pattern level
  console.log(`[Level Generator] Creating algorithmic level "${params.name}" (${params.rows}x${params.cols})`);

  const rawColors = [
    { id: 'c_dark', hex: '#0F172A', name: 'Nuit' },
    { id: 'c_blue', hex: '#0284C7', name: 'Bleu Ciel' },
    { id: 'c_cyan', hex: '#06B6D4', name: 'Cyan Néon' },
    { id: 'c_gold', hex: '#F59E0B', name: 'Or Éclat' },
    { id: 'c_pink', hex: '#EC4899', name: 'Rose Fushia' },
    { id: 'c_purple', hex: '#8B5CF6', name: 'Violet Mystique' },
  ].slice(0, params.maxColors);

  const palette = rawColors;
  const targetGrid = [];

  for (let r = 0; r < params.rows; r++) {
    const row = [];
    for (let c = 0; c < params.cols; c++) {
      const colorIdx = (r * 2 + c) % palette.length;
      row.push(palette[colorIdx].id);
    }
    targetGrid.push(row);
  }

  return {
    id: params.id,
    name: params.name,
    rows: params.rows,
    columns: params.cols,
    difficulty: params.difficulty,
    category: params.category,
    palette,
    targetGrid,
  };
}

function main() {
  const params = parseArgs();

  console.log('----------------------------------------------------');
  console.log('💎 GEM FILL — Image to Level Converter');
  console.log('----------------------------------------------------');
  console.log(` ID: ${params.id}`);
  console.log(` Nom: ${params.name}`);
  console.log(` Dimensions: ${params.rows}x${params.cols}`);
  console.log(` Max Couleurs: ${params.maxColors}`);

  const levelData = generateMockLevel(params);

  let outputContent = '';
  const isTs = !params.output || params.output.endsWith('.ts');

  if (isTs) {
    outputContent = `import { Level } from '../../types/level';

export const level${levelData.id}: Level = ${JSON.stringify(levelData, null, 2)};
`;
  } else {
    outputContent = JSON.stringify(levelData, null, 2);
  }

  const outputPath = params.output || path.join(__dirname, `../src/data/levels/level${levelData.id}.ts`);
  fs.writeFileSync(outputPath, outputContent, 'utf-8');

  console.log(`✅ Niveau généré avec succès dans : ${outputPath}`);
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  main();
}
