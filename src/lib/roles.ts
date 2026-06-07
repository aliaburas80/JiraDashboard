// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Shared application role definitions for auth, admin user management, and role-scoped views.

import type { ViewId } from '@/types/dashboardView';

export type AppRole =
  | 'admin'
  | 'scrum_master'
  | 'product_owner'
  | 'manager'
  | 'c_level'
  | 'user';

export const ROLE_OPTIONS: Array<{ id: AppRole; label: string; description: string }> = [
  { id: 'admin',         label: 'Admin',         description: 'Full system access, settings, all users, all import logs.' },
  { id: 'scrum_master', label: 'Scrum Master',  description: 'Sprint, flow, blockers, and team delivery execution view.' },
  { id: 'product_owner', label: 'Product Owner', description: 'Epic readiness, product delivery, release confidence, and roadmap view.' },
  { id: 'manager',       label: 'Manager',       description: 'Team health, capacity, trends, and cross-user import visibility.' },
  { id: 'c_level',       label: 'C-level',       description: 'Executive summary, portfolio health, top risks, and cross-user visibility.' },
  { id: 'user',          label: 'User',          description: 'Standard contributor access to own uploads and full dashboard view.' },
];

export const ASSIGNABLE_ROLES: AppRole[] = ['admin', 'scrum_master', 'product_owner', 'manager', 'c_level'];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && ROLE_OPTIONS.some(role => role.id === value);
}

export function roleLabel(role: string | null | undefined): string {
  return ROLE_OPTIONS.find(option => option.id === role)?.label ?? 'User';
}

export function canViewAllImportData(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'manager' || role === 'c_level';
}

export function defaultDashboardViewForRole(role: string | null | undefined): ViewId {
  switch (role) {
    case 'scrum_master':  return 'scrum_master';
    case 'product_owner': return 'product_owner';
    case 'manager':       return 'engineering_manager';
    case 'c_level':       return 'executive';
    default:              return 'full';
  }
}

export function isDashboardViewLockedForRole(role: string | null | undefined): boolean {
  return role === 'scrum_master' || role === 'product_owner' || role === 'manager' || role === 'c_level';
}

export function allowedDashboardViewsForRole(role: string | null | undefined): ViewId[] {
  return isDashboardViewLockedForRole(role)
    ? [defaultDashboardViewForRole(role)]
    : ['full', 'executive', 'scrum_master', 'product_owner', 'engineering_manager'];
}

const COMMON_ROUTES = ['/profile', '/help', '/glossary', '/landing', '/change-password'];

export function allowedRoutePrefixesForRole(role: string | null | undefined): string[] {
  switch (role) {
    case 'admin':
      return [
        '/dashboard', '/summary', '/charts', '/explore', '/backend', '/customer',
        '/snapshots', '/trends', '/readiness', '/teams', '/portfolio', '/developer', '/admin',
        ...COMMON_ROUTES,
      ];
    case 'scrum_master':
      return ['/dashboard', '/summary', '/charts', '/trends', '/teams', '/readiness', '/explore', '/snapshots', ...COMMON_ROUTES];
    case 'product_owner':
      return ['/dashboard', '/summary', '/readiness', '/portfolio', '/customer', '/explore', '/snapshots', ...COMMON_ROUTES];
    case 'manager':
      return ['/dashboard', '/summary', '/charts', '/trends', '/teams', '/portfolio', '/readiness', '/customer', '/snapshots', '/backend', ...COMMON_ROUTES];
    case 'c_level':
      return ['/dashboard', '/summary', '/portfolio', '/customer', '/trends', ...COMMON_ROUTES];
    default:
      return ['/dashboard', '/summary', '/charts', '/explore', '/customer', '/snapshots', '/trends', '/readiness', '/teams', '/portfolio', ...COMMON_ROUTES];
  }
}

export function canAccessRoute(role: string | null | undefined, pathname: string): boolean {
  if (pathname === '/') return true;
  const allowed = allowedRoutePrefixesForRole(role);
  return allowed.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function fallbackRouteForRole(role: string | null | undefined): string {
  switch (role) {
    case 'c_level': return '/summary';
    default:        return '/dashboard';
  }
}
