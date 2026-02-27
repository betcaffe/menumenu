import { Link } from 'react-router-dom';
import { LogOut, ChefHat, User, Settings, Layers, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Bottone from './Bottone';
import { ReactNode, useState } from 'react';

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
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50 transition-all duration-300 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-8">
      {user && (
        <div className="flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 items-center gap-2 sm:gap-4 mt-1 md:mt-0">
          <Link 
            to="/" 
            className="flex flex-col md:flex-row items-center gap-0 md:gap-2 text-gray-600 hover:text-[--secondary] px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all text-center"
            title="Home"
          >
            <Home className="w-5 h-5" />
            <span className="block md:hidden text-[10px] mt-0.5 leading-none">Home</span>
            <span className="hidden lg:inline text-sm font-medium">Home</span>
          </Link>
          <Link 
            to="/impostazioni" 
            className="flex flex-col md:flex-row items-center gap-0 md:gap-2 text-gray-600 hover:text-[--secondary] px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all text-center"
            title="Impostazioni"
          >
            <Settings className="w-5 h-5" />
            <span className="block md:hidden text-[10px] mt-0.5 leading-none">Impostazioni</span>
            <span className="hidden lg:inline text-sm font-medium">Impostazioni</span>
          </Link>
          <Link 
            to="/gestione-comande" 
            className="flex flex-col md:flex-row items-center gap-0 md:gap-2 text-gray-600 hover:text-[--secondary] px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all text-center"
            title="Gestione Comande"
          >
            <Layers className="w-5 h-5" />
            <span className="block md:hidden text-[10px] mt-0.5 leading-none">Comande</span>
            <span className="hidden lg:inline text-sm font-medium">Gestione Comande</span>
          </Link>
        </div>
      )}
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
              <button 
                  onClick={() => setMobileAccountOpen(v => !v)} 
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 border border-gray-200 md:cursor-default"
                  aria-haspopup="true"
                  aria-expanded={mobileAccountOpen}
                  title="Account"
              >
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <Bottone 
                onClick={signOut} 
                variante="fantasma" 
                className="hidden md:flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Esci</span>
            </Bottone>
          </>
        )}
      </div>
    </nav>
    {/* Mobile account dropdown */}
    {user && mobileAccountOpen && (
      <>
        <div 
          className="fixed left-0 right-0 bottom-0 top-16 sm:top-20 z-40 md:hidden"
          onClick={() => setMobileAccountOpen(false)}
        />
        <div className="fixed left-0 right-0 top-16 sm:top-20 z-[60] md:hidden">
          <div className="bg-white border-t border-gray-200 shadow-md">
            <button 
              onClick={() => { setMobileAccountOpen(false); signOut(); }} 
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </>
    )}
    </>
  );
}
