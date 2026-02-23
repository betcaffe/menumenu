export interface Elemento {
  id: string;
  x: number;
  y: number;
  type: 'rect' | 'wall' | 'text' | 'room' | 'door';
  label?: string;
  width?: number;
  height?: number;
  rotation?: number;
  fontSize?: number;
  normalized?: boolean;
}

export const GRID_SIZE = 20;
