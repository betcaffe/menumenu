import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { Elemento, GRID_SIZE } from './types';

interface ElementoCanvasProps {
  elemento: Elemento;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, id: string) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>, id: string) => void;
  readOnly?: boolean;
  fillColor?: string;
}

export default function ElementoCanvas({
  elemento,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  readOnly = false,
  fillColor,
}: ElementoCanvasProps) {
  const w = elemento.width || 0;
  const h = elemento.height || 0;

  return (
    <Group
      id={elemento.id}
      x={elemento.x + w / 2}
      y={elemento.y + h / 2}
      offsetX={w / 2}
      offsetY={h / 2}
      width={w}
      height={h}
      rotation={elemento.rotation || 0}
      draggable={!readOnly}
      onDragEnd={(e) => !readOnly && onDragEnd(e, elemento.id)}
      onClick={!readOnly || elemento.type === 'rect' ? onSelect : undefined}
      onTap={!readOnly || elemento.type === 'rect' ? onSelect : undefined}
      onTransformEnd={(e) => !readOnly && onTransformEnd(e, elemento.id)}
    >
      {elemento.type === 'wall' && (
        <Rect
          width={w}
          height={h}
          fill="#2c3e50"
          stroke={isSelected ? '#FF6B35' : undefined}
          strokeWidth={isSelected ? 2 : 0}
          cornerRadius={2}
        />
      )}

      {elemento.type === 'room' && (
        <Rect
          x={-GRID_SIZE / 2}
          y={-GRID_SIZE / 2}
          width={w + GRID_SIZE}
          height={h + GRID_SIZE}
          stroke="#2c3e50"
          strokeWidth={GRID_SIZE}
          fill="transparent"
          listening={false}
        />
      )}

      {elemento.type === 'door' && (
        <Group>
            {/* White background to hide the wall behind */}
            <Rect
                width={w}
                height={h}
                fill="#ffffff"
            />
            {/* Door visual: simple arc or lines */}
            <Rect
                width={w}
                height={h}
                stroke={isSelected ? '#FF6B35' : '#4B5563'}
                strokeWidth={isSelected ? 3 : 2}
                cornerRadius={2}
            />
            {/* Door swing arc visualization could go here */}
            <Text
                text="PORTA"
                fontSize={10}
                width={w}
                height={h}
                fill={isSelected ? '#FF6B35' : '#4B5563'}
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
            />
        </Group>
      )}

      {(elemento.type === 'rect' || elemento.type === 'bancone') && (
        <>
          <Rect
            width={w}
            height={h}
            fill={fillColor || (elemento.type === 'bancone' ? '#e5e7eb' : (isSelected ? '#FFE8D6' : '#fff'))}
            stroke={isSelected ? '#FF6B35' : '#4B5563'}
            strokeWidth={isSelected ? 2 : 1}
            cornerRadius={elemento.type === 'bancone' ? 2 : 4}
            shadowColor="black"
            shadowBlur={5}
            shadowOpacity={0.1}
            shadowOffset={{ x: 2, y: 2 }}
          />
          <Text
            text={elemento.label}
            fontSize={14}
            fontStyle="bold"
            fill="#4B5563"
            width={w}
            height={h}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </>
      )}

      {elemento.type === 'text' && (
        <Text
          text={elemento.label}
          fontSize={elemento.fontSize || 16}
          fontStyle="bold"
          fill="#4B5563"
          width={w}
          align="center"
        />
      )}
    </Group>
  );
}
