// API Configuration
// Use proxy in development - Vite will proxy /api to backend
export const API_BASE_URL = 'http://localhost:3031'

// User Roles (matching backend)
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  STATE_ADMIN: "state_admin",
  BRANCH_ADMIN: "branch_admin",
  ZONAL_ADMIN: "zonal_admin",
  WORKER: "worker",
  REGISTRAR: "registrar",
  GUEST: "guest",
};

// Base navigation items
export const BASE_NAVIGATION_ITEMS = {
  dashboard: { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  events: { path: "/events", label: "Events", icon: "event" },
  guests: { path: "/guests", label: "Guests", icon: "people" },
  myGuests: { path: "/guests", label: "My Guests", icon: "people" },
  workers: { path: "/workers", label: "Workers", icon: "work" },
  registrars: { path: "/registrars", label: "Registrars", icon: "assignment" },
  analytics: { path: "/analytics", label: "Analytics", icon: "analytics" },
  checkin: { path: "/checkin", label: "Check-in", icon: "assignment" },
};

// Role-based navigation permissions
export const ROLE_NAVIGATION_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    "dashboard",
    "events",
    "guests",
    "workers",
    "registrars",
    "analytics",
  ],
  [ROLES.STATE_ADMIN]: [
    "dashboard",
    "events",
    "guests",
    "workers",
    "registrars",
    "analytics",
  ],
  [ROLES.BRANCH_ADMIN]: [
    "dashboard",
    "events",
    "guests",
    "workers",
    "registrars",
    "analytics",
  ],
  [ROLES.ZONAL_ADMIN]: ["dashboard", "events", "guests", "registrars"],
  [ROLES.WORKER]: ["dashboard", "events", "myGuests"],
  [ROLES.REGISTRAR]: ["dashboard", "events", "checkin"],
};

// Helper function to get navigation items for a specific role
export const getNavigationItems = (role) => {
  const permissions = ROLE_NAVIGATION_PERMISSIONS[role] || [];
  return permissions
    .map((permission) => BASE_NAVIGATION_ITEMS[permission])
    .filter(Boolean);
};

// Legacy export for backward compatibility (will be deprecated)
export const NAVIGATION_ITEMS = Object.keys(ROLES).reduce((acc, role) => {
  acc[ROLES[role]] = getNavigationItems(ROLES[role]);
  return acc;
}, {});

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    PROFILE: "/api/auth/profile",
  },
  EVENTS: {
    BASE: "/api/events",
    LIST: "/api/events",
    HIERARCHICAL: "/api/admin-hierarchy/events",
    ACCESSIBLE: "/api/events/accessible",
    ACTIVE: "/api/events/active",
    UPCOMING: "/api/events/upcoming",
    NEEDING_BRANCH_SELECTION:
      "/api/admin-hierarchy/events/needing-branch-selection",
    NEEDING_ZONE_SELECTION:
      "/api/admin-hierarchy/events/needing-zone-selection",
    SELECT_BRANCHES: "/api/admin-hierarchy/events/:eventId/select-branches",
    SELECT_ZONES: "/api/admin-hierarchy/events/:eventId/select-zones",
    ASSIGN_PICKUP_STATIONS: "/api/events/assign-pickup-stations",
  },
  GUESTS: {
    BASE: "/api/guests",
    ADMIN: "/api/admin/guests",
    ANALYTICS: "/api/admin/guests/analytics",
    SEARCH: "/api/admin/guests/search",
    QUICK_SEARCH: "/api/admin/guests/quick-search",
    STATISTICS: "/api/admin/guests/statistics",
    EXPORT: "/api/admin/guests/export",
  },
  WORKERS: {
    BASE: "/api/workers",
    REGISTER: "/api/workers/register",
    PENDING: "/api/workers/pending",
    APPROVED: "/api/workers/approved",
    STATS: "/api/workers/stats",
    REGISTER_GUEST: "/api/workers/events",
    MY_GUESTS: "/api/workers/guests",
    ALL_EVENTS: "/api/workers/events/all",
    MY_EVENTS: "/api/workers/events/my",
    VOLUNTEER: "/api/workers/events",
    EVENT_PICKUP_STATIONS: "/api/workers/events/:eventId/pickup-stations",
    PENDING_VOLUNTEERS: "/api/workers/volunteer-requests/pending",
    APPROVE_VOLUNTEER: "/api/workers/volunteer-requests",
  },
  REGISTRARS: {
    BASE: "/api/registrars",
    REGISTER: "/api/registrars/register",
    PENDING: "/api/registrars/pending",
    APPROVED: "/api/registrars/approved",
    APPROVE: "/api/registrars/approve",
    REJECT: "/api/registrars/reject",
    CHECK_IN: "/api/check-in",
    SEARCH_GUESTS: "/api/registrars/guests/search",
    CHECK_IN_GUEST: "/api/registrars/guests/check-in",
    DASHBOARD: "/api/registrars/dashboard",
    STATISTICS: "/api/registrars/events",
    ASSIGNMENTS_SUMMARY: "/api/registrars/assignments-summary",
    // New volunteer-based endpoints
    STATS: "/api/registrars/stats",
    ALL_EVENTS: "/api/registrars/events/all",
    MY_EVENTS: "/api/registrars/events/my",
    VOLUNTEER: "/api/registrars/events",
    CHECK_IN_GUESTS: "/api/registrars/events",
    VOLUNTEER_STATS: "/api/registrars/volunteer/stats",
    VOLUNTEER_EVENTS: "/api/registrars/volunteer/events",
    VOLUNTEER_MY_EVENTS: "/api/registrars/volunteer/events/my",
    VOLUNTEER_FOR_EVENT: "/api/registrars/volunteer/events",
    VOLUNTEER_EVENT_GUESTS: "/api/registrars/volunteer/events",
    VOLUNTEER_CHECKIN: "/api/registrars/volunteer/events",
    // Branch Admin approval endpoints
    PENDING_VOLUNTEER_REQUESTS: "/api/registrars/admin/volunteer-requests/pending",
    APPROVE_VOLUNTEER_REQUEST: "/api/registrars/admin/volunteer-requests",
    REJECT_VOLUNTEER_REQUEST: "/api/registrars/admin/volunteer-requests",
    // Super Admin endpoints
    SUPER_ADMIN_ALL: "/api/registrars/super-admin/all",
    SUPER_ADMIN_PENDING: "/api/registrars/super-admin/pending",
    SUPER_ADMIN_APPROVE: "/api/registrars/super-admin/approve",
    SUPER_ADMIN_REJECT: "/api/registrars/super-admin/reject",
  },
  ANALYTICS: {
    DASHBOARD: "/api/admin/guests/analytics/basic",
    TRENDS: "/api/admin/guests/analytics/trends",
    WORKER_PERFORMANCE: "/api/admin/guests/analytics/worker-performance",
    EVENT_SUMMARY: "/api/admin/guests/analytics/events",
    EXPORT: "/api/admin/guests/export",
  },
  ADMIN: {
    USERS: "/api/admin/users",
    HIERARCHY: "/api/admin-hierarchy",
    STATES: "/api/admin-hierarchy/accessible-states",
    BRANCHES: "/api/admin-hierarchy/selection/branches",
    ZONES: "/api/admin-hierarchy/selection/zones",
    STATISTICS: "/api/admin/statistics",
    AVAILABLE_OPTIONS: "/api/admin-hierarchy/events",
    CREATE_SUPER_ADMIN_EVENT: "/api/admin-hierarchy/events/super-admin",
    CREATE_STATE_ADMIN_EVENT: "/api/admin-hierarchy/events/state-admin",
    CREATE_BRANCH_ADMIN_EVENT: "/api/admin-hierarchy/events/branch-admin",
    CREATE_ZONAL_ADMIN_EVENT: "/api/admin-hierarchy/events/zonal-admin", // Branch Admin specific endpoints
    PENDING_ZONE_ADMINS: "/api/admin-hierarchy/branch/pending-zone-admins",
    APPROVED_ZONE_ADMINS: "/api/admin-hierarchy/branch/approved-zone-admins",
    APPROVE_ZONE_ADMIN: "/api/admin-hierarchy/branch/approve-zone-admin",
    REJECT_ZONE_ADMIN: "/api/admin-hierarchy/branch/reject-zone-admin",
    // State Admin specific endpoints
    PENDING_BRANCH_ADMINS: "/api/admin-hierarchy/state/pending-branch-admins",
    APPROVED_BRANCH_ADMINS: "/api/admin-hierarchy/state/approved-branch-admins",
    APPROVE_BRANCH_ADMIN: "/api/admin-hierarchy/state/approve-branch-admin",
    REJECT_BRANCH_ADMIN: "/api/admin-hierarchy/state/reject-branch-admin",
    BRANCH_ZONES: "/api/admin-hierarchy/branch/zones",
    BRANCH_DASHBOARD_STATS: "/api/admin-hierarchy/branch/dashboard-stats",
    WORKERS: "/api/admin-hierarchy/workers",
    GUESTS: "/api/admin-hierarchy/guests",
    // Performance Rankings
    RANKINGS_WORKERS: "/api/admin-hierarchy/rankings/workers",
    RANKINGS_BRANCHES: "/api/admin-hierarchy/rankings/branches",
    RANKINGS_STATES: "/api/admin-hierarchy/rankings/states",
  },
  STATES: {
    BASE: "/api/states",
    LIST: "/api/states",
    CREATE: "/api/states",
    UPDATE: "/api/states",
    DETAILS: "/api/states",
  },
  BRANCHES: {
    BASE: "/api/branches",
    LIST: "/api/branches",
    CREATE: "/api/branches",
    UPDATE: "/api/branches",
    DELETE: "/api/branches",
    BY_STATE: "/api/branches/by-state",
    // Super Admin specific endpoints
    ALL_WITH_ADMINS: "/api/branches/super-admin/all-with-admins",
    // State Admin specific endpoints
    STATE_ADMIN_CREATE: "/api/branches/state-admin/create",
    STATE_ADMIN_LIST: "/api/branches/state-admin/my-branches",
    STATE_ADMIN_UPDATE: "/api/branches/state-admin",
    STATE_ADMIN_DELETE: "/api/branches/state-admin",
  },
  ZONES: {
    BASE: "/api/zones",
    LIST: "/api/zones",
    CREATE: "/api/zones",
    UPDATE: "/api/zones",
    DELETE: "/api/zones",
    BY_BRANCH: "/api/zones/by-branch",
    STATISTICS: "/api/zones/statistics",
    ALL_WITH_ADMINS: "/api/zones/super-admin/all-with-admins", // Branch Admin specific endpoints
    BRANCH_ADMIN_CREATE: "/api/zones/branch-admin/create",
    BRANCH_ADMIN_LIST: "/api/zones/branch-admin/list",
    BRANCH_ADMIN_UPDATE: "/api/zones/branch-admin",
    BRANCH_ADMIN_DELETE: "/api/zones/branch-admin",
    // State Admin specific endpoints
    STATE_ADMIN_LIST: "/api/zones/state-admin/my-zones",
  },

  PICKUP_STATIONS: {
    BASE: "/api/pickup-stations",
    ASSIGN: "/api/pickup-stations/assign",
    ZONE_STATIONS: "/api/pickup-stations/zone",
    BY_BRANCH: "/api/pickup-stations/by-branch",
    // State Admin specific endpoints
    STATE_ADMIN_LIST: "/api/pickup-stations/state-admin/my-stations",
  },
  USERS: {
    BASE: "/api/users",
    REQUEST_REGISTRAR_ACCESS: "/api/users/request-registrar-access",
    SWITCH_ROLE: "/api/users/switch-role",
    REVOKE_ROLE_SWITCHING: "/api/users/revoke-role-switching",
  },
};

// Status constants
export const STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  ACTIVE: "active",
  INACTIVE: "inactive",
};

// Event statuses - match the backend EventStatus enum
export const EVENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published", // This is considered "active" in the system
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};
