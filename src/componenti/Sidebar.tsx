import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export function Sidebar({ children, className = '' }: SidebarProps) {
  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pb-24 md:pb-0 ${className}`}>
      {children}
    </div>
  );
}

interface SidebarSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function SidebarSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = false 
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-gray-700">{icon}</span>}
          <span className="font-bold text-gray-700">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

interface SidebarItemProps {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  rightElement?: ReactNode;
  color?: 'default' | 'green' | 'red';
}

export function SidebarItem({ 
  label, 
  icon, 
  active = false, 
  onClick,
  rightElement,
  color = 'default'
}: SidebarItemProps) {
  let activeClass = '';
  let inactiveClass = '';
  let iconClass = '';

  switch (color) {
    case 'green':
      activeClass = 'bg-green-50 border-r-4 border-r-green-500 text-green-700';
      inactiveClass = 'bg-white text-gray-600 hover:bg-green-50 border-r-4 border-r-transparent hover:border-r-green-200';
      iconClass = active ? 'text-green-500' : 'text-gray-400';
      break;
    case 'red':
      activeClass = 'bg-red-50 border-r-4 border-r-red-500 text-red-700';
      inactiveClass = 'bg-white text-gray-600 hover:bg-red-50 border-r-4 border-r-transparent hover:border-r-red-200';
      iconClass = active ? 'text-red-500' : 'text-gray-400';
      break;
    default:
      activeClass = 'bg-orange-50 border-r-4 border-r-[--primary] text-[--primary]';
      inactiveClass = 'bg-white text-gray-600 hover:bg-gray-50 border-r-4 border-r-transparent';
      iconClass = active ? 'text-[--primary]' : 'text-gray-400';
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 transition-colors border-b border-gray-100
        ${active ? activeClass : inactiveClass}`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className={iconClass}>{icon}</span>}
        <span className={`font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
      </div>
      {rightElement}
    </button>
  );
}
