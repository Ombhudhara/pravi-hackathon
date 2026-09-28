// Content for the Home page
export const homeContent = {
  hero: {
    title: "Land and property records for government departments",
    description: "PropertyNexus keeps one register of government land and buildings, tracks their status, inspections and repairs, and shows them on a map.",
    signupNote: "New accounts are approved by an administrator before they can sign in.",
    lifecycle: [
      { id: "acquired", label: "Acquired", icon: "Download" },
      { id: "registered", label: "Registered", icon: "FileText" },
      { id: "allocated", label: "Allocated", icon: "UserCheck" },
      { id: "in-use", label: "In use", icon: "Activity" },
      { id: "inspected", label: "Inspected", icon: "ClipboardCheck" },
      { id: "maintenance", label: "Maintenance", icon: "Wrench" },
      { id: "retired", label: "Retired", icon: "Archive" }
    ]
  },
  whatItDoes: {
    title: "What it does",
    features: [
      {
        id: "register",
        title: "Asset register",
        description: "One record per land parcel or building with a generated code, type, location, area and status.",
        icon: "Database"
      },
      {
        id: "lifecycle",
        title: "Lifecycle history",
        description: "Every allocation, status change and inspection is kept as a dated event that cannot be edited or deleted.",
        icon: "History"
      },
      {
        id: "map",
        title: "Map view",
        description: "Assets with coordinates are shown on an OpenStreetMap map with filters and status shapes.",
        icon: "Map"
      },
      {
        id: "inspections",
        title: "Inspections",
        description: "Officers record a condition checklist with photos and reports, and the overall condition is calculated by a fixed rule.",
        icon: "ClipboardList"
      },
      {
        id: "maintenance",
        title: "Maintenance workflow",
        description: "Issues move through Open, Assigned, In progress, Resolved and Verified, with evidence required before a repair is marked resolved.",
        icon: "Wrench"
      },
      {
        id: "analytics",
        title: "Utilization and analytics",
        description: "Underutilized assets are flagged for administrative review, with condition, maintenance and inspection reports and CSV export.",
        icon: "BarChart3"
      }
    ]
  },
  howItWorks: {
    title: "How it works",
    steps: [
      "Register the asset",
      "Assign it to an officer",
      "Inspect and record condition",
      "Report and repair issues",
      "Review status and reports"
    ]
  },
  roles: {
    title: "Roles",
    note: "Officers see only the assets assigned to them. Maintenance staff see only the issues assigned to them or their department.",
    list: [
      {
        id: "admin",
        title: "Administrator",
        icon: "ShieldAlert",
        permissions: [
          "Manage users and roles",
          "Create and edit assets",
          "Reassign assets",
          "View full analytics"
        ]
      },
      {
        id: "officer",
        title: "Officer",
        icon: "Shield",
        permissions: [
          "View assigned assets",
          "Record inspections",
          "Report maintenance issues",
          "Update asset status"
        ]
      },
      {
        id: "maintenance",
        title: "Maintenance",
        icon: "Wrench",
        permissions: [
          "View assigned issues",
          "Update issue status",
          "Upload repair evidence",
          "Mark issues resolved"
        ]
      }
    ]
  },
  dataAndAccess: {
    title: "Data and access",
    facts: [
      "Accounts are approved by an administrator",
      "Access depends on role",
      "Inspection photos and documents are stored on the server",
      "The map tiles are requested from the configured tile provider"
    ]
  },
  cta: {
    title: "Sign in to continue"
  }
};
