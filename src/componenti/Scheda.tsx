import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  children: ReactNode;
  className?: string;
  interattiva?: boolean;
}

export default function Scheda({ children, className, interattiva = false }: Props) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-lg border border-gray-100 p-6",
        interattiva && "hover:shadow-xl transition-shadow cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
