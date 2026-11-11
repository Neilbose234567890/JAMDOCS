/**
 * Document lifecycle helpers.
 *
 * A document becomes "expired" as soon as its expiry date passes. When that
 * happens the last known version is snapshotted into `entity.oldDocuments`
 * (the "Old Documents" archive) so the entity can be renewed with a new
 * document without losing the history of the previous one.
 *
 * Everything here is pure: callers decide when to persist the result.
 */

export const EXPIRING_DAYS = 30;

/** Parse a `YYYY-MM-DD` value as a local date (avoids UTC off-by-one). */
const parseDay = (value) => {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length < 3 || parts.some(n => Number.isNaN(n))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

const toDayString = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Compute the status of a document from its expiry date.
 * @returns {'valid'|'expiring'|'expired'|'missing'}
 */
export const getDocStatus = (expiryDate, today = new Date()) => {
  const expiry = parseDay(expiryDate);
  if (!expiry) return 'missing';
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (expiry < startOfToday) return 'expired';
  const diffDays = Math.round((expiry - startOfToday) / 86400000);
  return diffDays <= EXPIRING_DAYS ? 'expiring' : 'valid';
};

/** True when a document slot actually holds a scanned/saved document. */
export const isTrackedDoc = (doc) =>
  Boolean(doc) && doc.status !== 'missing' &&
  Boolean(doc.docNumber || doc.expiryDate || doc.fileName || doc.lastUpdated);

/** Archive entries stored on an entity (never undefined). */
export const getArchivedDocs = (entity) =>
  Array.isArray(entity?.oldDocuments) ? entity.oldDocuments : [];

/**
 * Stable identity for an archived version, so reloading the app (or renewing
 * twice) never creates duplicate archive rows.
 */
export const archiveKey = (docType, doc) =>
  ['ARCH', docType, doc?.docNumber || '', doc?.expiryDate || '', doc?.lastUpdated || ''].join('|');

export const createArchiveEntry = (docType, doc, reason = 'expired', archivedAt = toDayString()) => ({
  id: archiveKey(docType, doc),
  docType,
  docNumber: doc?.docNumber || '',
  startDate: doc?.startDate || '',
  expiryDate: doc?.expiryDate || '',
  extractedFields: { ...(doc?.extractedFields || {}) },
  fileName: doc?.fileName || '',
  lastUpdated: doc?.lastUpdated || '',
  status: 'expired',
  archivedAt,
  reason
});

/** Add an archive entry unless an identical one is already stored. */
export const withArchiveEntry = (entity, docType, doc, reason = 'expired') => {
  const archive = getArchivedDocs(entity);
  const key = archiveKey(docType, doc);
  if (archive.some(entry => entry.id === key)) return entity;
  return { ...entity, oldDocuments: [...archive, createArchiveEntry(docType, doc, reason)] };
};

/**
 * Recompute every document status and archive newly expired documents.
 * Returns the original array reference when nothing changed so React state
 * updates can be skipped safely.
 */
export const applyLifecycle = (entities) => {
  if (!Array.isArray(entities) || entities.length === 0) return { entities, changed: false };

  let changed = false;
  const nextEntities = entities.map((entity) => {
    const documents = entity?.documents;
    if (!documents) return entity;

    const archive = getArchivedDocs(entity);
    let nextArchive = archive;
    const nextDocuments = {};
    let entityChanged = false;

    Object.entries(documents).forEach(([docType, doc]) => {
      if (!doc || doc.status === 'missing' || !doc.expiryDate) {
        nextDocuments[docType] = doc;
        return;
      }

      const status = getDocStatus(doc.expiryDate);
      let nextDoc = doc;
      if (status !== doc.status) {
        nextDoc = { ...nextDoc, status };
        entityChanged = true;
      }

      if (status === 'expired' && isTrackedDoc(doc)) {
        const key = archiveKey(docType, doc);
        if (!nextArchive.some(entry => entry.id === key)) {
          if (nextArchive === archive) nextArchive = [...archive];
          nextArchive.push(createArchiveEntry(docType, doc));
          entityChanged = true;
        }
        if (!nextDoc.archived) {
          nextDoc = { ...nextDoc, archived: true };
          entityChanged = true;
        }
      }

      nextDocuments[docType] = nextDoc;
    });

    if (!entityChanged) return entity;
    changed = true;
    return { ...entity, documents: nextDocuments, oldDocuments: nextArchive };
  });

  return { entities: changed ? nextEntities : entities, changed };
};
