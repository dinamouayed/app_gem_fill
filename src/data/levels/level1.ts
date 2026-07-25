import { Level } from '../../types/level';

export const level1: Level = {
  id: 1,
  name: 'Cœur Rubis',
  rows: 4,
  columns: 4,
  difficulty: 'easy',
  category: 'Symboles',
  palette: [
    { id: 'bg', hex: '#1E1B2E', name: 'Fond Sombre' },
    { id: 'red', hex: '#FF2E63', name: 'Rubis Rouge' },
    { id: 'pink', hex: '#FF84A1', name: 'Rose Brillant' },
  ],
  targetGrid: [
    ['bg',   'red',  'red',  'bg'],
    ['red',  'pink', 'red',  'red'],
    ['red',  'red',  'red',  'red'],
    ['bg',   'red',  'red',  'bg'],
  ],
};
