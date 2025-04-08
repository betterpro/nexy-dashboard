export const ROLES = {
  SUPER_ADMIN: "superadmin",
  FRANCHISEE: "franchisee",
  PARTNER: "partner",
};

// Define which roles can access which routes
export const ROUTE_ACCESS = {
  // Super admin has access to everything
  "/admin": [ROLES.SUPER_ADMIN],
  "/admin/users": [ROLES.SUPER_ADMIN],
  "/admin/settings": [ROLES.SUPER_ADMIN],

  // Franchisee routes
  "/franchisee": [ROLES.FRANCHISEE],
  "/franchisee/dashboard": [ROLES.FRANCHISEE],
  "/franchisee/reports": [ROLES.FRANCHISEE],

  // Partner routes
  "/partner": [ROLES.PARTNER],
  "/partner/dashboard": [ROLES.PARTNER],
  "/partner/analytics": [ROLES.PARTNER],

  // Shared routes (accessible by multiple roles)
  "/profile": [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
  "/settings": [ROLES.SUPER_ADMIN, ROLES.FRANCHISEE, ROLES.PARTNER],
};

// Helper function to check if a user has access to a route
export const hasAccess = (userRole, route) => {
  const allowedRoles = ROUTE_ACCESS[route];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
};
