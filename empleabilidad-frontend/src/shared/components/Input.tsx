import React from 'react';
import { cn } from '@/shared/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, hint, id, readOnly, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          readOnly={readOnly}
          className={cn(
            'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            error && 'border-red-400 focus:ring-red-400 focus:border-red-400',
            success && !error && 'border-emerald-400 focus:ring-emerald-400 focus:border-emerald-400',
            readOnly && 'bg-slate-50 text-slate-600 cursor-default focus:ring-0 focus:border-slate-300',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-500 font-medium flex items-center gap-1">
            {error}
          </span>
        )}
        {success && !error && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="6" fill="currentColor" opacity="0.15"/>
              <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success}
          </span>
        )}
        {hint && !error && !success && (
          <span className="text-xs text-slate-400 font-normal">{hint}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

