// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Role model tests — admin-managed roles and role-scoped defaults.

import {
  canViewAllImportData,
  canAccessRoute,
  fallbackRouteForRole,
  isAppRole,
  roleLabel,
} from '../lib/roles';

test('role helper accepts supported Delivery Clarity roles', () => {
  expect(isAppRole('admin')).toBe(true);
  expect(isAppRole('scrum_master')).toBe(true);
  expect(isAppRole('product_owner')).toBe(true);
  expect(isAppRole('manager')).toBe(true);
  expect(isAppRole('c_level')).toBe(true);
  expect(isAppRole('unknown')).toBe(false);
});

test('role labels are human-readable', () => {
  expect(roleLabel('scrum_master')).toBe('Scrum Master');
  expect(roleLabel('product_owner')).toBe('Product Owner');
  expect(roleLabel('c_level')).toBe('C-level');
});

test('role-scoped import visibility allows admin, manager, and c-level to view all imports', () => {
  expect(canViewAllImportData('admin')).toBe(true);
  expect(canViewAllImportData('manager')).toBe(true);
  expect(canViewAllImportData('c_level')).toBe(true);
  expect(canViewAllImportData('scrum_master')).toBe(false);
  expect(canViewAllImportData('product_owner')).toBe(false);
});

test('role route matrix blocks routes outside assigned role scope', () => {
  expect(canAccessRoute('scrum_master', '/teams')).toBe(true);
  expect(canAccessRoute('scrum_master', '/admin/settings')).toBe(false);
  expect(canAccessRoute('scrum_master', '/portfolio')).toBe(true);
  expect(canAccessRoute('scrum_master', '/members')).toBe(true);

  expect(canAccessRoute('product_owner', '/portfolio')).toBe(true);
  expect(canAccessRoute('product_owner', '/teams')).toBe(true);
  expect(canAccessRoute('product_owner', '/members')).toBe(true);

  expect(canAccessRoute('c_level', '/summary')).toBe(true);
  expect(canAccessRoute('c_level', '/explore')).toBe(false);
  expect(canAccessRoute('c_level', '/members')).toBe(true);
  expect(canAccessRoute('admin', '/developer')).toBe(true);
  expect(canAccessRoute('admin', '/members')).toBe(true);
  expect(canAccessRoute('scrum_master', '/change-password')).toBe(true);
  expect(canAccessRoute('product_owner', '/change-password')).toBe(true);
  expect(canAccessRoute('manager', '/change-password')).toBe(true);
  expect(canAccessRoute('c_level', '/change-password')).toBe(true);
});

test('role fallback route sends c-level to summary and delivery roles to dashboard', () => {
  expect(fallbackRouteForRole('c_level')).toBe('/summary');
  expect(fallbackRouteForRole('scrum_master')).toBe('/dashboard');
});
