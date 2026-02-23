import { Link } from 'react-router-dom';
import { LogOut, ChefHat, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Bottone from './Bottone';
import { ReactNode } from 'react';

interface NavbarProps {
  title?: React.ReactNode;
  icon?: ReactNode;
  leftActions?: ReactNode;
  pageActions?: ReactNode;
  rightActions?: ReactNode;
}

export default function Navbar({ 
  title = "MenuMenu", 
  icon = <ChefHat className="w-6 h-6 sm:w-8 sm:h-8" />,
  leftActions,
  pageActions,
  rightActions
}: NavbarProps) {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50 transition-all duration-300 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-4">
        {leftActions}
        
        <Link to="/" className="text-[--primary] hover:text-[--secondary] transition-colors p-2 rounded-full hover:bg-gray-100">
          {icon}
        </Link>
        
        {typeof title === 'string' ? (
          <span className="font-bold text-lg sm:text-xl text-[--secondary] hidden sm:block">
            {title}
          </span>
        ) : (
          title
        )}

        {pageActions}
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {rightActions}
        
        {user && (
          <>
            <div className="flex items-center gap-3 text-right">
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-semibold text-gray-800">{user.email?.split('@')[0]}</span>
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 border border-gray-200">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            
            <Bottone 
                onClick={signOut} 
                variante="fantasma" 
                className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Esci</span>
            </Bottone>
          </>
        )}
      </div>
    </nav>
  );
}
