// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Pure helpers for the member directory — shared between the page and its tests.

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  avatarUrl: string;
  position: string;
  phone: string;
  contactEmail: string;
  address: string;
  certificates: string;
  bio: string;
}

export function initialsFor(member: Member): string {
  return member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || member.email.slice(0, 2).toUpperCase();
}

export function contactEmailFor(member: Member): string {
  return member.contactEmail || member.email;
}

export function matchesMemberQuery(member: Member, query: string): boolean {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  return `${member.name} ${member.email} ${member.position} ${member.roleLabel} ${member.bio}`
    .toLowerCase()
    .includes(text);
}
