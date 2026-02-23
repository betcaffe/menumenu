import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HeaderProps {
  title: string;
  icon?: ReactNode;
  backLink?: string;
  className?: string;
  children?: ReactNode; // For right-side content
}

export default function Header({ 
  title, 
  icon, 
  backLink = '/', 
  className,
  children 
}: HeaderProps) {
  return (
    <header className={cn(
      "bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10 shrink-0",
      className
    )}>
      <div className="flex items-center gap-4">
        {backLink && (
          <Link to={backLink} className="text-gray-500 hover:text-[--secondary] p-1 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        )}
        <h1 className="text-xl font-bold text-[--secondary] flex items-center gap-2">
          {icon}
          {title}
        </h1>
      </div>
      
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </header>
  );
}
