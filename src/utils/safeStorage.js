// Defensive localStorage helpers.
//
// Reading persisted JSON must never throw. A single corrupt (or unavailable)
// value used to blow up App's useState initializers, which unmounted the whole
// React tree and left the user staring at a blank white page - with no login
// screen and therefore no reachable "Reset Data" escape hatch.

export const STORAGE_KEYS = {
  categories: 'ocr_doc_categories',
  employees: 'ocr_tracker_employees',
  companies: 'ocr_tracker_companies',
  vehicles: 'ocr_tracker_vehicles',
  properties: 'ocr_tracker_properties',
  users: 'ocr_tracker_users',
  fieldConfigs: 'ocr_field_configs',
  theme: 'ocr_theme'
};

// Keys that hold document/account data. Theme is deliberately excluded so a
// "reset data" keeps the user's visual preference.
export const ALL_DATA_KEYS = [
  STORAGE_KEYS.users,
  STORAGE_KEYS.employees,
  STORAGE_KEYS.companies,
  STORAGE_KEYS.vehicles,
  STORAGE_KEYS.properties,
  STORAGE_KEYS.categories,
  STORAGE_KEYS.fieldConfigs
];

const warned = new Set();
const warn = (message) => {
  try {
    console.warn(message);
  } catch {
    // Console unavailable (locked-down browser) - ignoring is fine.
  }
};

// Storage can be read/written on every render, so log each problem only once.
const warnOnce = (message) => {
  if (warned.has(message)) return;
  warned.add(message);
  warn(message);
};

const getRaw = (key) => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    warnOnce(`localStorage is not readable (key "${key}") - falling back to defaults.`);
    return null;
  }
};

export const removeKey = (key) => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    // Nothing sensible to do - the app must keep running.
  }
};

/** Read a plain string value (e.g. the theme). Never throws. */
export const loadString = (key, fallback = '') => {
  const raw = getRaw(key);
  return raw === null || raw === '' ? fallback : raw;
};

/**
 * Read + parse a JSON value.
 * @param {string} key       localStorage key
 * @param {*} fallback       value used when the key is missing/corrupt
 * @param {(value: * ) => boolean} [validate] shape check; a failing value is
 *        treated exactly like corrupt JSON (dropped, defaults used).
 */
export const loadJSON = (key, fallback, validate) => {
  const raw = getRaw(key);
  if (raw === null || raw === '') return fallback;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    warnOnce(`Dropped corrupt "${key}" from localStorage - using defaults.`);
    removeKey(key);
    return fallback;
  }

  if (validate && !validate(parsed)) {
    warnOnce(`Dropped "${key}" with unexpected shape - using defaults.`);
    removeKey(key);
    return fallback;
  }

  return parsed;
};

/** Read a JSON array of objects, skipping null/primitive entries.
 *  An intentionally empty stored array stays empty - only missing/corrupt data
 *  falls back, so deleting every record is not silently undone on reload. */
export const loadArray = (key, fallback = [], isItem = () => true) => {
  const parsed = loadJSON(key, null, Array.isArray);
  if (!Array.isArray(parsed)) return fallback;
  return parsed.filter((item) => item && typeof item === 'object' && isItem(item));
};

/** Persist a JSON value. Quota / disabled-storage errors are swallowed. */
export const saveJSON = (key, value) => {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    warnOnce(`Could not persist "${key}" to localStorage (storage full or blocked).`);
    return false;
  }
};

/** Persist a plain string value. */
export const saveString = (key, value) => {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, String(value));
    return true;
  } catch {
    warnOnce(`Could not persist "${key}" to localStorage (storage full or blocked).`);
    return false;
  }
};

/** Wipe the document/account data so the app falls back to seed defaults. */
export const clearAppData = (keys = ALL_DATA_KEYS) => {
  keys.forEach(removeKey);
};
