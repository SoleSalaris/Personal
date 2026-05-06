import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, className, disabled, ...props }, ref) => {
    return (
      <div className={cn("w-full space-y-1", disabled && "opacity-60")}>
        <label className="block text-sm font-semibold text-gris-med">{label}</label>
        <div className="relative">
          {prefix && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gris-med font-medium pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-12 px-4 bg-white border rounded-custom transition-all outline-hidden focus:ring-2 focus:ring-primary/10 focus:border-primary",
              prefix && "pl-10",
              error ? "border-error focus:ring-error/10 focus:border-error" : "border-gris-border",
              disabled && "bg-gris-divider text-gris-light cursor-not-allowed",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <div className="flex items-center gap-1 text-xs text-error font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
