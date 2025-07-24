import { useAuth } from './useAuth';
import { ROLES } from '../utils/constants';

export const usePermissions = () => {
  const { user, hasRole, hasAnyRole } = useAuth();

  const permissions = {
    // Admin permissions
    canManageEvents: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN
    ]),

    canCreateEvents: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN
    ]),

    canManageUsers: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN
    ]),

    canApproveWorkers: () => hasRole(ROLES.BRANCH_ADMIN),

    canApproveRegistrars: () => hasRole(ROLES.BRANCH_ADMIN),

    canManageGuests: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.SUPER_ME,
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.BRANCH_ME,
      ROLES.ZONAL_ADMIN
    ]),

    canRegisterGuests: () => hasRole(ROLES.WORKER),

    canCheckInGuests: () => hasAnyRole([ROLES.REGISTRAR, ROLES.PCU, ROLES.INTERN]),

    canMarkFirstTimers: () => hasAnyRole([ROLES.PCU, ROLES.INTERN]),

    canViewAnalytics: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.SUPER_ME,
      ROLES.BRANCH_ME,
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN
    ]),

    canExportData: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.SUPER_ME,
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN,
      ROLES.BRANCH_ME,
      ROLES.ZONAL_ADMIN,
      ROLES.SUPER_ME,
      ROLES.BRANCH_ME
    ]),

    canAssignZones: () => hasAnyRole([
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN
    ]),

    // Role checks
    isSuperAdmin: () => hasRole(ROLES.SUPER_ADMIN),
    isSuperMe: () => hasRole(ROLES.SUPER_ME),
    isBranchMe: () => hasRole(ROLES.BRANCH_ME),
    isStateAdmin: () => hasRole(ROLES.STATE_ADMIN),
    isBranchAdmin: () => hasRole(ROLES.BRANCH_ADMIN),
    isBranchMe: () => hasRole(ROLES.BRANCH_ME),
    isZonalAdmin: () => hasRole(ROLES.ZONAL_ADMIN),
    isWorker: () => hasRole(ROLES.WORKER),
    isRegistrar: () => hasRole(ROLES.REGISTRAR),

    // Navigation permissions
    canAccessDashboard: () => !!user,
    canAccessEvents: () => hasAnyRole([
      ROLES.SUPER_ADMIN,
      ROLES.SUPER_ME,
      ROLES.STATE_ADMIN,
      ROLES.BRANCH_ADMIN,
      ROLES.ZONAL_ADMIN,
      ROLES.WORKER
    ]),
    canAccessGuests: () => hasAnyRole([
      ROLES.SUPER_ADMIN,
      ROLES.SUPER_ME, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.BRANCH_ME,
      ROLES.ZONAL_ADMIN,
      ROLES.WORKER
    ]),
    canAccessWorkers: () => hasAnyRole([
      ROLES.SUPER_ADMIN,
      ROLES.SUPER_ME,
      ROLES.STATE_ADMIN,
      ROLES.BRANCH_ADMIN,
      ROLES.BRANCH_ME
    ]),
    canAccessRegistrars: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.SUPER_ME,
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.BRANCH_ME,
      ROLES.ZONAL_ADMIN,
      ROLES.REGISTRAR
    ]),
    canAccessAnalytics: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.SUPER_ME,
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.BRANCH_ME,
      ROLES.ZONAL_ADMIN
    ])
  };

  return permissions;
};

export default usePermissions;
