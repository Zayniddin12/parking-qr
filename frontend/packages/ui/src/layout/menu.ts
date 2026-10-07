import type { ReactNode } from 'react';

/**
 * Config-driven main menu (replicates the Vue `MainMenuConfig`,
 * DESIGN-ALIGNMENT §2). Items are permission-filtered before render — a missing
 * `permission` means "always visible".
 */
export interface MenuItem {
  /** Route path (react-router). */
  to: string;
  /** i18n key or literal label. */
  title: string;
  /** Icon glyph or node. */
  icon: ReactNode;
  /** Permission name required to see this item (business-critical filtering). */
  permission?: string;
  /** Collapsible submenu. */
  children?: MenuItem[];
  /** Match route exactly (default true for '/', false otherwise). */
  end?: boolean;
}

export type MainMenuConfig = MenuItem[];

/** A permission checker, e.g. from a `useCan` hook. */
export type CanFn = (permission: string) => boolean;

/** Filter a menu tree by permission. */
export function filterMenu(menu: MainMenuConfig, can?: CanFn): MainMenuConfig {
  if (!can) return menu;
  return menu
    .filter((item) => !item.permission || can(item.permission))
    .map((item) => (item.children ? { ...item, children: filterMenu(item.children, can) } : item));
}
