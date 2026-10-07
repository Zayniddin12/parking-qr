import type { MainMenuConfig } from '@autoparking/ui';

/** Single-operator (business) module menu (DESIGN-ALIGNMENT §5). Each item is
 *  permission-filtered by `useCan` before render; routes are declared in App. */
export const MENU: MainMenuConfig = [
  { to: '/', title: 'menu.dashboard', icon: '▦', end: true, permission: 'dashboard.view' },
  { to: '/branches', title: 'menu.branches', icon: '🏬', permission: 'branches.view' },
  { to: '/tariffs', title: 'menu.tariffs', icon: '💲', permission: 'tariffs.view' },
  { to: '/permits', title: 'menu.permits', icon: '🅿️', permission: 'permits.view' },
  { to: '/payments', title: 'menu.payments', icon: '💳', permission: 'payments.view' },
  { to: '/validation', title: 'menu.validation', icon: '🎟️', permission: 'validation.view' },
  { to: '/lists', title: 'menu.lists', icon: '📋', permission: 'lists.view' },
  { to: '/partners', title: 'bp.partners.title', icon: '🤝', permission: 'validation.view' },
  { to: '/devices', title: 'menu.devices', icon: '📷', permission: 'devices.view' },
  { to: '/users', title: 'menu.users', icon: '👥', permission: 'users.view' },
];
