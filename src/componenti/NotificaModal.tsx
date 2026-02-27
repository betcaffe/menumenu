import { useEffect } from 'react';
import Bottone from './Bottone';
interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  variant?: 'success' | 'info' | 'error';
  autoCloseMs?: number;
}
export default function NotificaModal({ open, onClose, title, message, variant = 'info', autoCloseMs }: Props) {
  useEffect(() => {
    if (!open || !autoCloseMs) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [open, autoCloseMs, onClose]);
  if (!open) return null;
  const headerBg = variant === 'success' ? 'bg-green-50' : variant === 'error' ? 'bg-red-50' : 'bg-gray-50';
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[94%] max-w-sm overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className={`p-4 border-b border-gray-200 ${headerBg}`}>
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        </div>
        {message && (
          <div className="p-4">
            <p className="text-gray-600">{message}</p>
          </div>
        )}
        <div className="p-4 border-t flex justify-end">
          <Bottone variante="primario" onClick={onClose}>
            OK
          </Bottone>
        </div>
      </div>
    </div>
  );
}
