import { Level } from '../../types/level';

export const level3: Level = {
  id: 3,
  name: 'Champignon Magique',
  rows: 8,
  columns: 8,
  difficulty: 'medium',
  category: 'Nature',
  palette: [
    { id: 'bg', hex: '#111827', name: 'Nuit' },
    { id: 'red', hex: '#EF4444', name: 'Chapeau Rouge' },
    { id: 'white', hex: '#F9FAFB', name: 'Pois Blanc' },
    { id: 'stem', hex: '#FEF3C7', name: 'Pied Beige' },
    { id: 'grass', hex: '#10B981', name: 'Herbe Émeraude' },
  ],
  targetGrid: [
    ['bg',    'bg',    'red',   'red',   'red',   'red',   'bg',    'bg'],
    ['bg',    'red',   'white', 'red',   'red',   'white', 'red',   'bg'],
    ['red',   'white', 'white', 'red',   'red',   'white', 'white', 'red'],
    ['red',   'red',   'red',   'red',   'red',   'red',   'red',   'red'],
    ['bg',    'bg',    'stem',  'stem',  'stem',  'stem',  'bg',    'bg'],
    ['bg',    'bg',    'stem',  'stem',  'stem',  'stem',  'bg',    'bg'],
    ['grass', 'grass', 'stem',  'stem',  'stem',  'stem',  'grass', 'grass'],
    ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
  ],
};
