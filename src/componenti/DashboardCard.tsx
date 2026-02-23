import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import Scheda from './Scheda';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  buttonText?: string;
  variant?: 'primario' | 'secondario';
  iconClassName?: string;
}

export default function DashboardCard({
  title,
  description,
  icon: Icon,
  to,
  buttonText,
  variant = 'primario',
  iconClassName
}: DashboardCardProps) {
  
  // Base styles from Bottone.tsx
  const buttonBase = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full px-4 py-2 text-base shadow-sm";
  
  const buttonVariants = {
    primario: "bg-[--primary] text-white group-hover:bg-orange-600",
    secondario: "bg-[--secondary] text-white group-hover:bg-blue-900",
  };

  // Default icon container styles if not provided
  const defaultIconClass = variant === 'primario' 
    ? "bg-orange-50 text-orange-600" 
    : "bg-blue-50 text-blue-600";

  const Content = (
    <div className="h-full transform transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl rounded-2xl">
      <Scheda 
          className="flex flex-col items-center text-center p-8 h-full justify-between border border-gray-100 shadow-md"
      >
          <div className="flex flex-col items-center w-full">
              <div className={cn(
                  "p-6 rounded-full mb-6 transition-colors duration-300", 
                  iconClassName || defaultIconClass
              )}>
                  <Icon size={48} strokeWidth={1.5} />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2">
                  {title}
              </h2>
              
              <p className="text-gray-500 text-lg mb-8 line-clamp-3">
                  {description}
              </p>
          </div>

          {buttonText && (
            <div className="w-full mt-auto">
                <div className={cn(buttonBase, buttonVariants[variant])}>
                    {buttonText}
                </div>
            </div>
          )}
      </Scheda>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full w-full group no-underline focus:outline-none">
        {Content}
      </Link>
    );
  }

  return (
    <div className="block h-full w-full group">
      {Content}
    </div>
  );
}
