import { Level } from '../../types/level';

export const level5: Level = {
  id: 5,
  name: 'Couronne Royale',
  rows: 12,
  columns: 12,
  difficulty: 'hard',
  category: 'Trésors',
  palette: [
    { id: 'bg', hex: '#0B0F19', name: 'Fond Noir' },
    { id: 'gold', hex: '#EAB308', name: 'Or Pur' },
    { id: 'ruby', hex: '#E11D48', name: 'Rubis' },
    { id: 'emerald', hex: '#10B981', name: 'Émeraude' },
    { id: 'sapphire', hex: '#3B82F6', name: 'Saphir' },
    { id: 'diamond', hex: '#E0F2FE', name: 'Diamant Brillant' },
  ],
  targetGrid: [
    ['bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg'],
    ['bg', 'ruby', 'bg', 'bg', 'emerald', 'bg', 'bg', 'sapphire', 'bg', 'bg', 'ruby', 'bg'],
    ['bg', 'gold', 'bg', 'bg', 'gold', 'bg', 'bg', 'gold', 'bg', 'bg', 'gold', 'bg'],
    ['bg', 'gold', 'diamond', 'bg', 'gold', 'diamond', 'bg', 'gold', 'diamond', 'bg', 'gold', 'bg'],
    ['bg', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'bg'],
    ['bg', 'gold', 'ruby', 'gold', 'emerald', 'gold', 'sapphire', 'gold', 'ruby', 'gold', 'gold', 'bg'],
    ['bg', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'bg'],
    ['bg', 'gold', 'diamond', 'gold', 'diamond', 'gold', 'diamond', 'gold', 'diamond', 'gold', 'gold', 'bg'],
    ['bg', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'bg'],
    ['bg', 'bg', 'ruby', 'ruby', 'ruby', 'ruby', 'ruby', 'ruby', 'ruby', 'ruby', 'bg', 'bg'],
    ['bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg'],
    ['bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg', 'bg'],
  ],
};
