import { Level } from '../../types/level';

export const level4: Level = {
  id: 4,
  name: 'Coucher de Soleil',
  rows: 10,
  columns: 10,
  difficulty: 'hard',
  category: 'Paysage',
  palette: [
    { id: 'sky', hex: '#3B0764', name: 'Nuit Pourpre' },
    { id: 'purple', hex: '#6B21A8', name: 'Violet Crépuscule' },
    { id: 'pink', hex: '#D946EF', name: 'Rose Néon' },
    { id: 'orange', hex: '#F97316', name: 'Orange Solaire' },
    { id: 'yellow', hex: '#FACC15', name: 'Soleil Jaune' },
    { id: 'water', hex: '#0284C7', name: 'Ocean Bleu' },
    { id: 'dark_water', hex: '#0C4A6E', name: 'Eau Proche' },
  ],
  targetGrid: [
    ['sky',   'sky',   'sky',   'sky',   'sky',   'sky',   'sky',   'sky',   'sky',   'sky'],
    ['purple','purple','purple','purple','purple','purple','purple','purple','purple','purple'],
    ['pink',  'pink',  'pink',  'pink',  'pink',  'pink',  'pink',  'pink',  'pink',  'pink'],
    ['orange','orange','orange','yellow','yellow','yellow','yellow','orange','orange','orange'],
    ['orange','orange','yellow','yellow','yellow','yellow','yellow','yellow','orange','orange'],
    ['water', 'water', 'water', 'water', 'yellow','yellow','water', 'water', 'water', 'water'],
    ['water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water', 'water'],
    ['dark_water','dark_water','dark_water','water','water','water','dark_water','dark_water','dark_water','dark_water'],
    ['dark_water','dark_water','dark_water','dark_water','dark_water','dark_water','dark_water','dark_water','dark_water','dark_water'],
    ['dark_water','dark_water','dark_water','dark_water','dark_water','dark_water','dark_water','dark_water','dark_water','dark_water'],
  ],
};
