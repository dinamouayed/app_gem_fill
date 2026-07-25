import { Level } from '../../types/level';

export const level2: Level = {
  id: 2,
  name: 'Étoile Céleste',
  rows: 6,
  columns: 6,
  difficulty: 'easy',
  category: 'Ciel',
  palette: [
    { id: 'space', hex: '#0F172A', name: 'Espace Nuit' },
    { id: 'gold', hex: '#F59E0B', name: 'Or Ambre' },
    { id: 'yellow', hex: '#FDE047', name: 'Jaune Éclat' },
    { id: 'cyan', hex: '#06B6D4', name: 'Bleu Néon' },
  ],
  targetGrid: [
    ['space', 'space', 'yellow', 'yellow', 'space', 'space'],
    ['space', 'gold',  'yellow', 'yellow', 'gold',  'space'],
    ['yellow','yellow','cyan',   'cyan',   'yellow','yellow'],
    ['yellow','yellow','cyan',   'cyan',   'yellow','yellow'],
    ['space', 'gold',  'yellow', 'yellow', 'gold',  'space'],
    ['space', 'space', 'gold',   'gold',   'space', 'space'],
  ],
};
