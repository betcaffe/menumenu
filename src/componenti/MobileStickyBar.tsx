import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface MobileStickyItem {
  key: string;
  to: string;
  label: string;
  icon: ReactNode;
  className?: string;
}

interface MobileStickyBarProps {
  items: MobileStickyItem[];
  activeKey?: string;
  defaultInactiveClass?: string;
  defaultActiveClass?: string;
}

export default function MobileStickyBar({ items, activeKey, defaultInactiveClass = 'text-gray-700', defaultActiveClass = 'bg-[--primary] text-white' }: MobileStickyBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] md:hidden grid"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="grid border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] bg-white"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`flex items-center justify-center gap-2 p-3 h-16 active:opacity-90 ${item.className ? item.className : (isActive ? defaultActiveClass : defaultInactiveClass)}`}
            >
              {item.icon}
              <span className="text-sm font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
