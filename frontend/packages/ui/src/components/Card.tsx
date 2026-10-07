import type { HTMLAttributes, ReactNode } from 'react';
import { color, radius, space, shadow, fontSize } from '../theme/tokens';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  actions?: ReactNode;
  /** Remove default padding (for edge-to-edge content like tables/tiles). */
  flush?: boolean;
}

/** Surface container used across every panel. */
export function Card({ title, actions, flush = false, children, style, ...rest }: CardProps) {
  return (
    <section
      {...rest}
      style={{
        background: color.bgElevated,
        border: `1px solid ${color.border}`,
        borderRadius: radius.lg,
        boxShadow: shadow.card,
        overflow: 'hidden',
        ...style,
      }}
    >
      {(title || actions) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${space.sm}px ${space.lg}px`,
            borderBottom: `1px solid ${color.border}`,
          }}
        >
          <div style={{ fontSize: fontSize.md, fontWeight: 600, color: color.text }}>{title}</div>
          {actions && <div style={{ display: 'flex', gap: space.sm }}>{actions}</div>}
        </header>
      )}
      <div style={{ padding: flush ? 0 : space.lg }}>{children}</div>
    </section>
  );
}
