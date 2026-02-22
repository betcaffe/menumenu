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
  return (
    <Group
      id={elemento.id}
      x={elemento.x}
      y={elemento.y}
      width={elemento.width}
      height={elemento.height}
      rotation={elemento.rotation || 0}
      draggable={!readOnly}
      onDragEnd={(e) => !readOnly && onDragEnd(e, elemento.id)}
      onClick={!readOnly || elemento.type === 'rect' ? onSelect : undefined}
      onTap={!readOnly || elemento.type === 'rect' ? onSelect : undefined}
      onTransformEnd={(e) => !readOnly && onTransformEnd(e, elemento.id)}
    >
      {elemento.type === 'wall' && (
        <Rect
          width={elemento.width}
          height={elemento.height}
          fill="#2c3e50"
          stroke={isSelected ? '#FF6B35' : undefined}
          strokeWidth={isSelected ? 2 : 0}
          cornerRadius={2}
        />
      )}

      {elemento.type === 'room' && (
        <Rect
          width={elemento.width}
          height={elemento.height}
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
                width={elemento.width}
                height={elemento.height}
                fill="#ffffff"
            />
            {/* Door visual: simple arc or lines */}
            <Rect
                width={elemento.width}
                height={elemento.height}
                stroke="#FF6B35"
                strokeWidth={2}
                cornerRadius={2}
            />
            {/* Door swing arc visualization could go here */}
            <Text
                text="DOOR"
                fontSize={10}
                width={elemento.width}
                height={elemento.height}
                align="center"
                verticalAlign="middle"
            />
        </Group>
      )}

      {elemento.type === 'rect' && (
        <>
          <Rect
            width={elemento.width}
            height={elemento.height}
            fill={fillColor || (isSelected ? '#FFE8D6' : '#fff')}
            stroke={isSelected ? '#FF6B35' : '#4B5563'}
            strokeWidth={isSelected ? 2 : 1}
            cornerRadius={4}
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
            width={elemento.width}
            height={elemento.height}
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
          width={elemento.width}
          align="center"
        />
      )}
    </Group>
  );
}
