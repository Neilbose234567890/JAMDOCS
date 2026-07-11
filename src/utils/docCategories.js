// Default Document Categories - Per Module
// Admin can add new or disable existing categories per module
export const defaultDocCategories = {
  employee: [
    { name: "Emirates ID", enabled: true },
    { name: "Visa", enabled: true },
    { name: "Labour Card", enabled: true },
    { name: "ILOE", enabled: true },
    { name: "Health Card", enabled: true },
    { name: "Passport", enabled: true },
    { name: "Drivers License", enabled: true },
    { name: "Other Documents", enabled: true }
  ],
  company: [
    { name: "Trade License", enabled: true },
    { name: "Tenancy Contract", enabled: true },
    { name: "Civil Defense", enabled: true },
    { name: "Municipality License", enabled: true },
    { name: "Company Passport", enabled: true },
    { name: "Other Documents", enabled: true }
  ],
  vehicle: [
    { name: "Registration", enabled: true },
    { name: "Insurance", enabled: true },
    { name: "Mulkiya", enabled: true },
    { name: "Passing Certificate", enabled: true },
    { name: "Other Documents", enabled: true }
  ],
  property: [
    { name: "Title Deed", enabled: true },
    { name: "Tenancy Contract", enabled: true },
    { name: "Ejari", enabled: true },
    { name: "DEWA Bill", enabled: true },
    { name: "Other Documents", enabled: true }
  ]
};

// Helper to migrate old flat array format to new per-module format
export function migrateDocCategories(saved) {
  // If it's already in the new format (object with module keys), return as-is
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    // Ensure all module keys exist
    const migrated = { ...defaultDocCategories };
    for (const mod of ['employee', 'company', 'vehicle', 'property']) {
      if (saved[mod] && Array.isArray(saved[mod])) {
        migrated[mod] = saved[mod];
      }
    }
    return migrated;
  }
  // Old flat array format - assign to employee only, use defaults for others
  if (Array.isArray(saved) && saved.length > 0) {
    return {
      employee: saved,
      company: [...defaultDocCategories.company],
      vehicle: [...defaultDocCategories.vehicle],
      property: [...defaultDocCategories.property]
    };
  }
  // No saved data - use defaults
  return { ...defaultDocCategories };
}
