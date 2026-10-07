import { Fragment } from 'react';
import { cn } from '../lib/cn';

export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
  /** Optional custom link renderer (e.g. router Link). Defaults to <a>. */
  renderLink?: (item: Crumb) => React.ReactNode;
}

/** Breadcrumb trail (aria nav). Last item is the current page. */
export function Breadcrumb({ items, className, renderLink }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-2xs', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li>
                {last || !item.href ? (
                  <span aria-current={last ? 'page' : undefined} className={last ? 'font-medium text-gray-700' : 'text-gray-500'}>
                    {item.label}
                  </span>
                ) : renderLink ? (
                  renderLink(item)
                ) : (
                  <a href={item.href} className="text-gray-500 hover:text-primary">
                    {item.label}
                  </a>
                )}
              </li>
              {!last && (
                <li aria-hidden="true" className="text-gray-400">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
