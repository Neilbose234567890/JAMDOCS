// System Users (Login Accounts)
// Separate from employee profiles - these are the people who log into the system
export const initialUsers = [
  {
    id: "USR001",
    name: "John Smith",
    email: "john.smith@company.com",
    password: "password123",
    sysRole: "admin",
    permissions: {
      view: true,
      add: true,
      edit: true,
      save: true,
      delete: true
    },
    assignedEmployees: "all", // "all" or array of employee IDs
    accessRights: ["Emirates ID", "Visa", "Labour Card", "ILOE", "Health Card", "Passport", "Drivers License", "Other Documents"]
  },
  {
    id: "USR002",
    name: "Sarah Jenkins",
    email: "sarah.j@company.com",
    password: "password123",
    sysRole: "contributor",
    permissions: {
      view: true,
      add: true,
      edit: true,
      save: true,
      delete: false
    },
    assignedEmployees: ["EMP001", "EMP002"],
    accessRights: ["Emirates ID", "Visa", "Passport"]
  },
  {
    id: "USR003",
    name: "Alex Mercer",
    email: "alex.m@company.com",
    password: "password123",
    sysRole: "contributor",
    permissions: {
      view: true,
      add: true,
      edit: false,
      save: false,
      delete: false
    },
    assignedEmployees: "all",
    accessRights: ["Emirates ID", "Visa", "Labour Card", "ILOE", "Health Card", "Passport", "Drivers License", "Other Documents"]
  }
];