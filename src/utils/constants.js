// API Configuration
// Use proxy in development - Vite will proxy /api to backend
export const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_BASE_URL 
  : '';

// User Roles (matching backend)
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  STATE_ADMIN: 'state_admin',
  BRANCH_ADMIN: 'branch_admin',
  ZONAL_ADMIN: 'zonal_admin',
  WORKER: 'worker',
  REGISTRAR: 'registrar',
  GUEST: 'guest'
};

// Base navigation items
export const BASE_NAVIGATION_ITEMS = {
  dashboard: { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  events: { path: '/events', label: 'Events', icon: 'event' },
  guests: { path: '/guests', label: 'Guests', icon: 'people' },
  myGuests: { path: '/guests', label: 'My Guests', icon: 'people' },
  workers: { path: '/workers', label: 'Workers', icon: 'work' },
  registrars: { path: '/registrars', label: 'Registrars', icon: 'assignment' },
  analytics: { path: '/analytics', label: 'Analytics', icon: 'analytics' },
  checkin: { path: '/checkin', label: 'Check-in', icon: 'assignment' }
};

// Role-based navigation permissions
export const ROLE_NAVIGATION_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['dashboard', 'events', 'guests', 'workers', 'registrars', 'analytics'],
  [ROLES.STATE_ADMIN]: ['dashboard', 'events', 'guests', 'workers', 'registrars', 'analytics'],
  [ROLES.BRANCH_ADMIN]: ['dashboard', 'events', 'guests', 'workers', 'registrars', 'analytics'],
  [ROLES.ZONAL_ADMIN]: ['dashboard', 'events', 'guests', 'registrars'],
  [ROLES.WORKER]: ['dashboard', 'events', 'myGuests'],
  [ROLES.REGISTRAR]: ['dashboard', 'checkin']
};

// Helper function to get navigation items for a specific role
export const getNavigationItems = (role) => {
  const permissions = ROLE_NAVIGATION_PERMISSIONS[role] || [];
  return permissions.map(permission => BASE_NAVIGATION_ITEMS[permission]).filter(Boolean);
};

// Legacy export for backward compatibility (will be deprecated)
export const NAVIGATION_ITEMS = Object.keys(ROLES).reduce((acc, role) => {
  acc[ROLES[role]] = getNavigationItems(ROLES[role]);
  return acc;
}, {});

// API Endpoints
export const API_ENDPOINTS = {  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile'
  },EVENTS: {
    BASE: '/api/events',
    HIERARCHICAL: '/api/events/hierarchical',
    ACCESSIBLE: '/api/events/accessible',
    ACTIVE: '/api/events/active',
    UPCOMING: '/api/events/upcoming'
  },  GUESTS: {
    BASE: '/api/guests',
    ADMIN: '/api/admin/guests',
    ANALYTICS: '/api/admin/guests/analytics',
    SEARCH: '/api/admin/guests/search',
    QUICK_SEARCH: '/api/admin/guests/quick-search',
    STATISTICS: '/api/admin/guests/statistics',
    EXPORT: '/api/admin/guests/export'
  },  WORKERS: {
    BASE: '/api/workers',
    REGISTER: '/api/workers/register',
    PENDING: '/api/workers/pending',
    REGISTER_GUEST: '/api/workers/events',
    MY_GUESTS: '/api/workers/guests'
  },  REGISTRARS: {
    BASE: '/api/registrars',
    REGISTER: '/api/registrars/register',
    PENDING: '/api/registrars/pending',
    CHECK_IN: '/api/check-in',
    SEARCH_GUESTS: '/api/registrars/guests/search',
    CHECK_IN_GUEST: '/api/registrars/guests/check-in',
    DASHBOARD: '/api/registrars/dashboard',
    STATISTICS: '/api/registrars/events',
    ASSIGNMENTS_SUMMARY: '/api/registrars/assignments-summary'
  },ANALYTICS: {
    DASHBOARD: '/api/admin/guests/analytics/basic',
    TRENDS: '/api/admin/guests/analytics/trends',
    WORKER_PERFORMANCE: '/api/admin/guests/analytics/worker-performance',
    EVENT_SUMMARY: '/api/admin/guests/analytics/events',
    EXPORT: '/api/admin/guests/export'
  },  ADMIN: {
    USERS: '/api/admin/users',
    HIERARCHY: '/api/admin-hierarchy',
    STATES: '/api/admin-hierarchy/states',
    BRANCHES: '/api/branches',
    ZONES: '/api/zones',
    STATISTICS: '/api/admin/statistics'
  }
};

// Status constants
export const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Event statuses
export const EVENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};
