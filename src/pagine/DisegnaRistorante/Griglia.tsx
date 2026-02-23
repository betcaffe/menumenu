import { Line } from 'react-konva';
import { GRID_SIZE } from './types';

interface GrigliaProps {
  stageSize: { width: number; height: number };
  visibleRect?: { x: number; y: number; width: number; height: number };
  gridSize?: number;
}

export default function Griglia({ stageSize, visibleRect, gridSize }: GrigliaProps) {
  const lines = [];
  const size = gridSize || GRID_SIZE;

  // Determine drawing bounds
  // If visibleRect is provided (e.g. when scaled/panned), use it to draw grid everywhere
  // Otherwise default to stageSize starting from 0,0
  const startX = visibleRect ? Math.floor(visibleRect.x / size) * size : 0;
  const startY = visibleRect ? Math.floor(visibleRect.y / size) * size : 0;
  
  const endX = visibleRect ? Math.ceil((visibleRect.x + visibleRect.width) / size) * size : stageSize.width;
  const endY = visibleRect ? Math.ceil((visibleRect.y + visibleRect.height) / size) * size : stageSize.height;

  // Add extra buffer just in case
  const buffer = size * 5;
  const renderStartX = startX - buffer;
  const renderStartY = startY - buffer;
  const renderEndX = endX + buffer;
  const renderEndY = endY + buffer;

  // Vertical lines
  for (let i = renderStartX; i <= renderEndX; i += size) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i, renderStartY, i, renderEndY]}
        stroke="#e5e7eb"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let i = renderStartY; i <= renderEndY; i += size) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[renderStartX, i, renderEndX, i]}
        stroke="#e5e7eb"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}
