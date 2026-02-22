import { Line } from 'react-konva';
import { GRID_SIZE } from './types';

interface GrigliaProps {
  stageSize: { width: number; height: number };
  visibleRect?: { x: number; y: number; width: number; height: number };
}

export default function Griglia({ stageSize, visibleRect }: GrigliaProps) {
  const lines = [];

  // Determine drawing bounds
  // If visibleRect is provided (e.g. when scaled/panned), use it to draw grid everywhere
  // Otherwise default to stageSize starting from 0,0
  const startX = visibleRect ? Math.floor(visibleRect.x / GRID_SIZE) * GRID_SIZE : 0;
  const startY = visibleRect ? Math.floor(visibleRect.y / GRID_SIZE) * GRID_SIZE : 0;
  
  const endX = visibleRect ? Math.ceil((visibleRect.x + visibleRect.width) / GRID_SIZE) * GRID_SIZE : stageSize.width;
  const endY = visibleRect ? Math.ceil((visibleRect.y + visibleRect.height) / GRID_SIZE) * GRID_SIZE : stageSize.height;

  // Add extra buffer just in case
  const buffer = GRID_SIZE * 5;
  const renderStartX = startX - buffer;
  const renderStartY = startY - buffer;
  const renderEndX = endX + buffer;
  const renderEndY = endY + buffer;

  // Vertical lines
  for (let i = renderStartX; i <= renderEndX; i += GRID_SIZE) {
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
  for (let i = renderStartY; i <= renderEndY; i += GRID_SIZE) {
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
