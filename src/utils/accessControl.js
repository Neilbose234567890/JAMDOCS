// Access-control helpers used to decide landing pages and visible records.
// Kept pure (no React, no localStorage) so they can be unit tested directly.

export const FALLBACK_MODULE = 'employee';

const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Only the entities a user is allowed to see.
 * Admins and users assigned to "all" see everything.
 */
export const filterVisibleEntities = (user, all = []) => {
  if (!user) return all;
  if (user.sysRole === 'admin') return all;
  if (user.assignedEmployees === 'all') return all;
  const assigned = user.assignedEmployees || [];
  return all.filter(e => assigned.includes(e.id));
};

/**
 * Record a contributor should land on right after signing in.
 * Order: e-mail match (account <-> record link) -> exact name match -> first
 * record of the pool. `list` must already be filtered to what the user may see;
 * an empty list always returns null (renders the "no record assigned" state).
 */
export const resolveUserEntity = (user, list = []) => {
  if (!user || user.sysRole === 'admin') return null;
  if (!Array.isArray(list) || list.length === 0) return null;
  const own = list.find(e => normalize(e.email) && normalize(e.email) === normalize(user.email))
    || list.find(e => normalize(e.name) && normalize(e.name) === normalize(user.name));
  return own || list[0];
};

/**
 * First document category the user is actually allowed to open.
 */
export const firstAccessibleDocType = (user, docTypes = []) => {
  if (user?.sysRole === 'admin') return docTypes[0] || '';
  const allowed = docTypes.filter(dt => (user?.accessRights || []).includes(dt));
  return allowed[0] || docTypes[0] || '';
};
