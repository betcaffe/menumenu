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
  const cellSize = size / 4; // Assuming gridSize is pixelsPerMeter (80px)

  // Determine drawing bounds
  const startX = visibleRect ? Math.floor(visibleRect.x / size) * size : 0;
  const startY = visibleRect ? Math.floor(visibleRect.y / size) * size : 0;
  
  const endX = visibleRect ? Math.ceil((visibleRect.x + visibleRect.width) / size) * size : stageSize.width;
  const endY = visibleRect ? Math.ceil((visibleRect.y + visibleRect.height) / size) * size : stageSize.height;

  const buffer = size * 2;
  const renderStartX = startX - buffer;
  const renderStartY = startY - buffer;
  const renderEndX = endX + buffer;
  const renderEndY = endY + buffer;

  // Vertical lines
  for (let i = renderStartX; i <= renderEndX; i += cellSize) {
    const isMajor = Math.abs(i % size) < 0.1;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i, renderStartY, i, renderEndY]}
        stroke={isMajor ? "#d1d5db" : "#f3f4f6"}
        strokeWidth={isMajor ? 1.5 : 1}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let i = renderStartY; i <= renderEndY; i += cellSize) {
    const isMajor = Math.abs(i % size) < 0.1;
    lines.push(
      <Line
        key={`h-${i}`}
        points={[renderStartX, i, renderEndX, i]}
        stroke={isMajor ? "#d1d5db" : "#f3f4f6"}
        strokeWidth={isMajor ? 1.5 : 1}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}
