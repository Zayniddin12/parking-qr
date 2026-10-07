import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading (or trailing) icon node. */
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  /** Large booth-touch target (>= 44px) for kiosk/attendant tablets. */
  touch?: boolean;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white border border-primary hover:bg-primary-600 active:bg-primary-700',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100',
  danger: 'bg-error text-white border border-error hover:bg-error-600',
  ghost: 'bg-transparent text-gray-500 border border-transparent hover:bg-gray-500/10',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-2xs gap-1',
  md: 'px-3.5 py-2 text-sm gap-1.5',
  lg: 'px-5 py-3 text-base gap-2',
};

/**
 * Themed button (variant/size/icon/loading/touch). All app actions route through
 * here so the design-alignment pass can restyle every surface from one place.
 * Uses the shared Tailwind preset, so it reads correctly on both the light
 * panels and the dark booth apps.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  touch = false,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const iconNode = loading ? (
    <span aria-hidden="true" className="inline-block animate-spin">
      ◠
    </span>
  ) : (
    icon
  );
  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-2lg font-semibold transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
        'disabled:cursor-not-allowed disabled:opacity-55',
        VARIANT[variant],
        SIZE[size],
        touch && 'min-h-[44px]',
        className,
      )}
    >
      {iconNode && iconPosition === 'left' && iconNode}
      {children}
      {iconNode && iconPosition === 'right' && iconNode}
    </button>
  );
}
