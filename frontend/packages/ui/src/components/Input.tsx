import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Leading adornment (icon / prefix). */
  leading?: ReactNode;
  /** Trailing adornment (icon / action). */
  trailing?: ReactNode;
  containerClassName?: string;
}

let counter = 0;
const nextId = () => `ap-input-${(counter += 1)}`;

/** Text input with label / hint / error and optional adornments. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, trailing, id, className, containerClassName, disabled, ...rest },
  ref,
) {
  const inputId = id ?? nextId();
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-2xs font-medium text-gray-600">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2 rounded-2lg border bg-white px-3 shadow-search transition-colors',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-100',
          error ? 'border-error' : 'border-gray-200',
          disabled && 'cursor-not-allowed bg-gray-100 opacity-70',
        )}
      >
        {leading && <span className="shrink-0 text-gray-500">{leading}</span>}
        <input
          {...rest}
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full bg-transparent py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none',
            className,
          )}
        />
        {trailing && <span className="shrink-0 text-gray-500">{trailing}</span>}
      </div>
      {error ? (
        <span id={`${inputId}-err`} className="text-2xs text-error">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${inputId}-hint`} className="text-2xs text-gray-500">
            {hint}
          </span>
        )
      )}
    </div>
  );
});
