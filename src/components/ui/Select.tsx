import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, disabled, ...props }, ref) => {
    return (
      <div className={cn("w-full space-y-1", disabled && "opacity-60")}>
        {label && <label className="block text-sm font-semibold text-gris-med">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-12 px-4 bg-white border rounded-custom appearance-none outline-hidden focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all pr-10",
              error ? "border-error" : "border-gris-border",
              disabled && "bg-gris-divider text-gris-light cursor-not-allowed",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-light pointer-events-none" />
        </div>
        {error && <span className="text-xs text-error font-medium">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
