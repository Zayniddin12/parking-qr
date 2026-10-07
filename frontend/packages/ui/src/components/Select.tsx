import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

let counter = 0;
const nextId = () => `ap-select-${(counter += 1)}`;

/** Native select styled to the design system (searchable variant TODO). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, id, className, containerClassName, disabled, ...rest },
  ref,
) {
  const selectId = id ?? nextId();
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-2xs font-medium text-gray-600">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...rest}
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full appearance-none rounded-2lg border bg-white px-3 py-2 pr-9 text-sm text-gray-700 shadow-search',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100',
            error ? 'border-error' : 'border-gray-200',
            disabled && 'cursor-not-allowed bg-gray-100 opacity-70',
            className,
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
          ▾
        </span>
      </div>
      {error && <span className="text-2xs text-error">{error}</span>}
    </div>
  );
});
