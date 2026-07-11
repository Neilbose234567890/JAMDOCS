// Seed data for Employee Document OCR and Tracker

export const demoTemplates = {
  "Emirates ID": {
    name: "Emirates ID Sample",
    description: "Simulate scan with mock Emirates ID card data",
    docNumber: "784-2000-3832428-9",
    startDate: "2024-03-15",
    expiryDate: "2028-03-14",
    extractedFields: {
      fullName: "BABLU PRAJAPATI RAMBRIKSH PRAJAPATI",
      nationality: "INDIA",
      dob: "2002-09-14",
      cardNumber: "139439373",
      sex: "MALE",
      occupation: "Fabricator",
      employer: "Jabel Al Malayha W.Shop LLC SP",
      issuingPlace: "Dubai"
    }
  },
  "Visa": {
    name: "UAE Residence Visa Sample",
    description: "Simulate scan with mock visa card data",
    docNumber: "201/2025/1234567",
    startDate: "2025-06-01",
    expiryDate: "2027-05-31",
    extractedFields: {
      fullName: "AHMED MOHAMMED ALI",
      fileNumber: "1029384",
      passportNumber: "K1234567",
      issuingPlace: "Dubai",
      occupation: "Welder",
      employer: "Jabel Al Malayha W.Shop LLC SP"
    }
  },
  "Passport": {
    name: "Passport Sample",
    description: "Simulate scan with mock passport data",
    docNumber: "K1234567",
    startDate: "2021-03-10",
    expiryDate: "2031-03-09",
    extractedFields: {
      fullName: "AHMED MOHAMMED ALI",
      placeOfBirth: "Dubai",
      authority: "ICA"
    }
  },
  "Labour Card": {
    name: "Labour Card Sample",
    description: "Simulate scan with mock labour card data",
    docNumber: "L-8849301",
    startDate: "2025-01-20",
    expiryDate: "2026-01-19",
    extractedFields: {
      fullName: "BABLU PRAJAPATI",
      workPermitNo: "WP-449301",
      establishmentName: "Jabel Al Malayha W.Shop LLC SP"
    }
  },
  "ILOE": {
    name: "ILOE Insurance Sample",
    description: "Simulate scan with mock ILOE policy data",
    docNumber: "ILOE-7739-10",
    startDate: "2025-07-20",
    expiryDate: "2026-07-20",
    extractedFields: {
      fullName: "BABLU PRAJAPATI",
      insuranceCompany: "Dubai Insurance Co",
      policyType: "Category A"
    }
  },
  "Health Card": {
    name: "Health Card Sample",
    description: "Simulate scan with mock health card data",
    docNumber: "HC-99302-DXB",
    startDate: "2025-06-01",
    expiryDate: "2026-06-01",
    extractedFields: {
      fullName: "BABLU PRAJAPATI",
      network: "Premium Global",
      provider: "Daman Insurance"
    }
  },
  "Drivers License": {
    name: "Drivers License Sample",
    description: "Simulate scan with mock driver license data",
    docNumber: "DL-908234-DXB",
    startDate: "2022-10-12",
    expiryDate: "2032-10-11",
    extractedFields: {
      fullName: "BABLU PRAJAPATI",
      class: "Light Motor Vehicle (3)",
      placeOfIssue: "Dubai (RTA)"
    }
  },
  "Other Documents": {
    name: "Generic Certificate Sample",
    description: "Simulate scan with mock certificate data",
    docNumber: "CERT-UIUX-2025",
    startDate: "2025-01-15",
    expiryDate: "2030-01-14",
    extractedFields: {
      fullName: "BABLU PRAJAPATI",
      title: "Senior UI Designer Certification",
      issuer: "UX Design Alliance"
    }
  }
};

export const initialEmployees = [
  {
    id: "EMP001",
    name: "John Smith",
    department: "Engineering",
    role: "Senior Fullstack Developer",
    email: "john.smith@company.com",
    avatar: "JS",
    accessRights: ["Emirates ID", "Visa", "Labour Card", "ILOE", "Health Card", "Passport", "Drivers License", "Other Documents"],
    documents: {
      "Emirates ID": {
        status: "valid",
        docNumber: "784-1990-1234567-1",
        startDate: "2024-05-15",
        expiryDate: "2027-05-14",
        extractedFields: {
          fullName: "John Smith",
          nationality: "British",
          dob: "1990-08-24",
          gender: "Male", // keep other tabs but EID is sex
          cardNumber: "800293812",
          employer: "TechCorp Solutions LLC",
          issuingPlace: "Abu Dhabi",
          occupation: "Senior Fullstack Developer",
          sex: "MALE"
        },
        lastUpdated: "2024-05-16",
        fileName: "emirates_id_john_smith.jpg"
      },
      "Visa": {
        status: "valid",
        docNumber: "201/2024/9876543",
        startDate: "2024-05-18",
        expiryDate: "2026-05-17",
        extractedFields: {
          uidNumber: "6543210",
          placeOfIssue: "Dubai",
          sponsorName: "TechCorp Solutions LLC"
        },
        lastUpdated: "2024-05-19",
        fileName: "visa_john_smith.jpg"
      },
      "Labour Card": {
        status: "valid",
        docNumber: "L-8849301",
        startDate: "2024-05-20",
        expiryDate: "2026-05-19",
        extractedFields: {
          workPermitNo: "WP-449301",
          establishmentName: "TechCorp Solutions LLC"
        },
        lastUpdated: "2024-05-21",
        fileName: "labour_card_john.jpg"
      },
      "ILOE": {
        status: "expiring",
        docNumber: "ILOE-7739-10",
        startDate: "2025-07-20",
        expiryDate: "2026-07-20", // Expiring soon relative to 2026-07-08
        extractedFields: {
          policyType: "Category A",
          insuranceCompany: "Dubai Insurance"
        },
        lastUpdated: "2025-07-21",
        fileName: "iloe_policy_john.pdf"
      },
      "Health Card": {
        status: "expired",
        docNumber: "HC-99302-DXB",
        startDate: "2025-06-01",
        expiryDate: "2026-06-01", // Expired relative to 2026-07-08
        extractedFields: {
          network: "Premium Global",
          provider: "Daman Insurance"
        },
        lastUpdated: "2025-06-02",
        fileName: "health_card_expired.jpg"
      },
      "Passport": {
        status: "valid",
        docNumber: "G5483920",
        startDate: "2020-03-10",
        expiryDate: "2030-03-09",
        extractedFields: {
          dob: "1990-08-24",
          placeOfBirth: "London",
          authority: "IPS"
        },
        lastUpdated: "2024-05-16",
        fileName: "passport_john.jpg"
      },
      "Drivers License": {
        status: "valid",
        docNumber: "DL-908234-DXB",
        startDate: "2022-10-12",
        expiryDate: "2032-10-11",
        extractedFields: {
          class: "Light Motor Vehicle (3)",
          placeOfIssue: "Dubai (RTA)"
        },
        lastUpdated: "2022-10-13",
        fileName: "driver_license_john.jpg"
      },
      "Other Documents": {
        status: "missing"
      }
    }
  },
  {
    id: "EMP002",
    name: "Sarah Jenkins",
    department: "Operations",
    role: "HR Operations Lead",
    email: "sarah.j@company.com",
    avatar: "SJ",
    accessRights: ["Emirates ID", "Visa", "Labour Card", "ILOE", "Health Card", "Passport", "Drivers License", "Other Documents"],
    documents: {
      "Emirates ID": {
        status: "expired",
        docNumber: "784-1988-8765432-2",
        startDate: "2023-06-15",
        expiryDate: "2026-06-14", // Expired relative to 2026-07-08
        extractedFields: {
          fullName: "Sarah Jenkins",
          nationality: "Canadian",
          dob: "1988-11-05",
          cardNumber: "800492813",
          employer: "Logistics Hub UAE",
          issuingPlace: "Dubai",
          occupation: "HR Operations Lead",
          sex: "FEMALE"
        },
        lastUpdated: "2023-06-16",
        fileName: "sarah_eid_expired.png"
      },
      "Visa": {
        status: "expiring",
        docNumber: "201/2024/1122334",
        startDate: "2024-07-28",
        expiryDate: "2026-07-27", // Expiring soon relative to 2026-07-08
        extractedFields: {
          uidNumber: "9988776",
          placeOfIssue: "Abu Dhabi",
          sponsorName: "TechCorp Solutions LLC"
        },
        lastUpdated: "2024-07-29",
        fileName: "visa_sarah.jpg"
      },
      "Labour Card": {
        status: "valid",
        docNumber: "L-2283948",
        startDate: "2024-07-28",
        expiryDate: "2026-07-27",
        extractedFields: {
          workPermitNo: "WP-112233",
          establishmentName: "TechCorp Solutions LLC"
        },
        lastUpdated: "2024-07-29",
        fileName: "labour_card_sarah.jpg"
      },
      "ILOE": {
        status: "valid",
        docNumber: "ILOE-5544-22",
        startDate: "2025-07-25",
        expiryDate: "2026-07-25",
        extractedFields: {
          policyType: "Category A",
          insuranceCompany: "Dubai Insurance"
        },
        lastUpdated: "2025-07-26",
        fileName: "iloe_sarah.pdf"
      },
      "Health Card": {
        status: "valid",
        docNumber: "HC-88771-AD",
        startDate: "2025-12-01",
        expiryDate: "2026-12-01",
        extractedFields: {
          network: "Silver Premium",
          provider: "Daman Insurance"
        },
        lastUpdated: "2025-12-02",
        fileName: "health_card_sarah.png"
      },
      "Passport": {
        status: "valid",
        docNumber: "TC9982471",
        startDate: "2018-09-05",
        expiryDate: "2028-09-04",
        extractedFields: {
          dob: "1988-11-05",
          placeOfBirth: "Toronto",
          authority: "Passport Canada"
        },
        lastUpdated: "2023-06-16",
        fileName: "passport_sarah.jpg"
      },
      "Drivers License": {
        status: "missing"
      },
      "Other Documents": {
        status: "missing"
      }
    }
  },
  {
    id: "EMP003",
    name: "Alex Mercer",
    department: "Design",
    role: "UI/UX Specialist",
    email: "alex.m@company.com",
    avatar: "AM",
    accessRights: ["Emirates ID", "Visa", "Labour Card", "ILOE", "Health Card", "Passport", "Drivers License", "Other Documents"],
    documents: {
      "Emirates ID": {
        status: "valid",
        docNumber: "784-1995-5544332-9",
        startDate: "2025-02-10",
        expiryDate: "2028-02-09",
        extractedFields: {
          fullName: "Alex Mercer",
          nationality: "American",
          dob: "1995-04-12",
          cardNumber: "800593821",
          employer: "Design Studio DXB",
          issuingPlace: "Dubai",
          occupation: "Senior UI/UX Specialist",
          sex: "MALE"
        },
        lastUpdated: "2025-02-11",
        fileName: "alex_eid.jpg"
      },
      "Visa": {
        status: "valid",
        docNumber: "201/2025/3344556",
        startDate: "2025-02-12",
        expiryDate: "2027-02-11",
        extractedFields: {
          uidNumber: "5544332",
          placeOfIssue: "Dubai",
          sponsorName: "TechCorp Solutions LLC"
        },
        lastUpdated: "2025-02-13",
        fileName: "visa_alex.jpg"
      },
      "Labour Card": {
        status: "valid",
        docNumber: "L-3344556",
        startDate: "2025-02-12",
        expiryDate: "2027-02-11",
        extractedFields: {
          workPermitNo: "WP-334455",
          establishmentName: "TechCorp Solutions LLC"
        },
        lastUpdated: "2025-02-13",
        fileName: "labour_card_alex.jpg"
      },
      "ILOE": {
        status: "valid",
        docNumber: "ILOE-9922-88",
        startDate: "2025-02-15",
        expiryDate: "2026-12-31",
        extractedFields: {
          policyType: "Category A",
          insuranceCompany: "Dubai Insurance"
        },
        lastUpdated: "2025-02-16",
        fileName: "iloe_alex.pdf"
      },
      "Health Card": {
        status: "valid",
        docNumber: "HC-11223-DXB",
        startDate: "2025-02-15",
        expiryDate: "2026-12-31",
        extractedFields: {
          network: "Basic Care",
          provider: "Orient Insurance"
        },
        lastUpdated: "2025-02-16",
        fileName: "health_card_alex.jpg"
      },
      "Passport": {
        status: "valid",
        docNumber: "USA667788",
        startDate: "2021-06-10",
        expiryDate: "2031-06-09",
        extractedFields: {
          dob: "1995-04-12",
          placeOfBirth: "New York",
          authority: "US Department of State"
        },
        lastUpdated: "2025-02-11",
        fileName: "passport_alex.jpg"
      },
      "Drivers License": {
        status: "valid",
        docNumber: "DL-665544-DXB",
        startDate: "2025-03-01",
        expiryDate: "2035-02-28",
        extractedFields: {
          class: "Light Motor Vehicle (3)",
          placeOfIssue: "Dubai (RTA)"
        },
        lastUpdated: "2025-03-02",
        fileName: "driver_license_alex.jpg"
      },
      "Other Documents": {
        status: "valid",
        docNumber: "CERT-UIUX-2025",
        startDate: "2025-01-15",
        expiryDate: "2030-01-14",
        extractedFields: {
          title: "Senior UI Designer Certification",
          issuer: "UX Design Alliance"
        },
        lastUpdated: "2025-01-16",
        fileName: "cert_alex.pdf"
      }
    }
  }
];


