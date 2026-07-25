export type GemColor = {
  id: string;
  hex: string;
  name?: string;
};

export type Level = {
  id: number;
  name: string;
  rows: number;
  columns: number;
  palette: GemColor[];
  targetGrid: string[][]; // Array of row arrays, each containing color IDs
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  author?: string;
};
