import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Funzione helper per unire classi tailwind
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variante?: 'primario' | 'secondario' | 'fantasma' | 'pericolo';
  dimensione?: 'sm' | 'md' | 'lg';
  pienaLarghezza?: boolean;
}

export default function Bottone({
  children,
  className,
  variante = 'primario',
  dimensione = 'md',
  pienaLarghezza = false,
  ...props
}: Props) {
  const stiliBase = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const varianti = {
    primario: "bg-[--primary] text-white hover:bg-orange-600 focus:ring-orange-500",
    secondario: "bg-[--secondary] text-white hover:bg-blue-900 focus:ring-blue-500",
    fantasma: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
    pericolo: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  };

  const dimensioni = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={cn(
        stiliBase,
        varianti[variante],
        dimensioni[dimensione],
        pienaLarghezza && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
