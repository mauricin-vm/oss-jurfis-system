import { OrganizationRole } from '@prisma/client';

export function canAccessSubjects(role: OrganizationRole): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}

export function canCreateSubject(role: OrganizationRole): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}

export function canEditSubject(role: OrganizationRole): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}

export function canDeleteSubject(role: OrganizationRole): boolean {
  return role === 'ADMIN';
}

export function canAccessMembers(role: OrganizationRole): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}

export function canCreateMember(role: OrganizationRole): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}

export function canEditMember(role: OrganizationRole): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}

export function canDeleteMember(role: OrganizationRole): boolean {
  return role === 'ADMIN';
}

export function canAccessSectors(role: OrganizationRole): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}

export function canCreateSector(role: OrganizationRole): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}

export function canEditSector(role: OrganizationRole): boolean {
  return role === 'ADMIN' || role === 'EMPLOYEE';
}

export function canDeleteSector(role: OrganizationRole): boolean {
  return role === 'ADMIN';
}
