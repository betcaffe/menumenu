import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "w-4 h-4 text-[--primary] rounded border-gray-300 focus:ring-[--primary] cursor-pointer",
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={props.id} className="text-sm text-gray-700 cursor-pointer select-none">
            {label}
          </label>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
