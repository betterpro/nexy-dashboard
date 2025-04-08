export const ROLES = {
  SUPER_ADMIN: "superadmin",
  PARTNER: "partner",
  FRANCHISEE: "franchisee",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES]; 