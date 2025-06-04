// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// User Roles (matching backend)
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STATE_ADMIN: 'STATE_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  ZONAL_ADMIN: 'ZONAL_ADMIN',
  WORKER: 'WORKER',
  REGISTRAR: 'REGISTRAR',
  GUEST: 'GUEST'
};

// Navigation items based on roles
export const NAVIGATION_ITEMS = {
  [ROLES.SUPER_ADMIN]: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/guests', label: 'Guests', icon: 'people' },
    { path: '/workers', label: 'Workers', icon: 'work' },
    { path: '/registrars', label: 'Registrars', icon: 'assignment' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics' }
  ],
  [ROLES.STATE_ADMIN]: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/guests', label: 'Guests', icon: 'people' },
    { path: '/workers', label: 'Workers', icon: 'work' },
    { path: '/registrars', label: 'Registrars', icon: 'assignment' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics' }
  ],
  [ROLES.BRANCH_ADMIN]: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/guests', label: 'Guests', icon: 'people' },
    { path: '/workers', label: 'Workers', icon: 'work' },
    { path: '/registrars', label: 'Registrars', icon: 'assignment' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics' }
  ],
  [ROLES.ZONAL_ADMIN]: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/guests', label: 'Guests', icon: 'people' },
    { path: '/registrars', label: 'Registrars', icon: 'assignment' }
  ],
  [ROLES.WORKER]: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/guests', label: 'My Guests', icon: 'people' }
  ],  [ROLES.REGISTRAR]: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/checkin', label: 'Check-in', icon: 'assignment' }
  ]
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile'
  },  EVENTS: {
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
  },REGISTRARS: {
    BASE: '/api/registrars',
    REGISTER: '/api/registrars/register',
    PENDING: '/api/registrars/pending',
    CHECK_IN: '/api/check-in',
    SEARCH_GUESTS: '/api/registrars/guests/search',
    CHECK_IN_GUEST: '/api/registrars/guests/check-in',
    DASHBOARD: '/api/registrars/dashboard',
    STATISTICS: '/api/registrars/events'
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
