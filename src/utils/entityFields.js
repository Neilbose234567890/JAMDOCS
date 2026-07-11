// Entity form field definitions per module
// Each module has its own set of fields for Add/Edit modals

export const moduleFieldConfigs = {
  employee: [
    { key: 'name', label: 'Name', type: 'text', placeholder: 'e.g. John Doe', required: true },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'e.g. john@company.com', required: false },
    { key: 'department', label: 'Department', type: 'select', options: ['General', 'Engineering', 'Operations', 'HR', 'Finance', 'Sales'], required: false },
    { key: 'role', label: 'Role', type: 'text', placeholder: 'e.g. Software Engineer', required: false },
  ],
  company: [
    { key: 'name', label: 'Company Name', type: 'text', placeholder: 'e.g. ABC Trading LLC', required: true },
    { key: 'tradeLicense', label: 'Trade License No.', type: 'text', placeholder: 'e.g. TL-2024-00123', required: false },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'e.g. info@company.com', required: false },
    { key: 'phone', label: 'Phone', type: 'text', placeholder: 'e.g. +971 50 123 4567', required: false },
  ],
  vehicle: [
    { key: 'name', label: 'Vehicle Name/Model', type: 'text', placeholder: 'e.g. Toyota Hiace 2024', required: true },
    { key: 'plateNumber', label: 'Plate Number', type: 'text', placeholder: 'e.g. ABC 1234', required: false },
    { key: 'chassisNumber', label: 'Chassis No.', type: 'text', placeholder: 'e.g. JTEHT05JX12345678', required: false },
    { key: 'year', label: 'Year', type: 'text', placeholder: 'e.g. 2024', required: false },
    { key: 'color', label: 'Color', type: 'text', placeholder: 'e.g. White', required: false },
  ],
  property: [
    { key: 'name', label: 'Property Name', type: 'text', placeholder: 'e.g. Al Majaz Tower', required: true },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. Al Nahda, Dubai', required: false },
    { key: 'unitNumber', label: 'Unit No.', type: 'text', placeholder: 'e.g. Apt 101, Floor 5', required: false },
    { key: 'propertyType', label: 'Type', type: 'select', options: ['Apartment', 'Villa', 'Office', 'Warehouse', 'Shop', 'Land'], required: false },
  ],
};

// Get default empty entity for a given module
export function getDefaultEntity(module) {
  const config = moduleFieldConfigs[module] || moduleFieldConfigs.employee;
  const defaults = {};
  config.forEach(f => {
    if (f.type === 'select' && f.options) {
      defaults[f.key] = f.options[0];
    } else {
      defaults[f.key] = '';
    }
  });
  return defaults;
}

// Extract display fields for entity detail view (shown when entity is selected)
export function getEntityDisplayFields(entity, module) {
  const config = moduleFieldConfigs[module] || moduleFieldConfigs.employee;
  const fields = [];
  config.forEach(f => {
    const val = entity[f.key];
    if (val && val !== 'General') {
      fields.push({ label: f.label, value: val });
    }
  });
  return fields;
}
