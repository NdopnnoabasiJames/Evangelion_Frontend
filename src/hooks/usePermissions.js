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
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN
    ]),

    canRegisterGuests: () => hasRole(ROLES.WORKER),

    canCheckInGuests: () => hasRole(ROLES.REGISTRAR),

    canViewAnalytics: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN
    ]),

    canExportData: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN
    ]),

    canAssignZones: () => hasAnyRole([
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN
    ]),

    // Role checks
    isSuperAdmin: () => hasRole(ROLES.SUPER_ADMIN),
    isStateAdmin: () => hasRole(ROLES.STATE_ADMIN),
    isBranchAdmin: () => hasRole(ROLES.BRANCH_ADMIN),
    isZonalAdmin: () => hasRole(ROLES.ZONAL_ADMIN),
    isWorker: () => hasRole(ROLES.WORKER),
    isRegistrar: () => hasRole(ROLES.REGISTRAR),

    // Navigation permissions
    canAccessDashboard: () => !!user,
    canAccessEvents: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN,
      ROLES.WORKER
    ]),
    canAccessGuests: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN,
      ROLES.WORKER
    ]),
    canAccessWorkers: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN
    ]),
    canAccessRegistrars: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN,
      ROLES.REGISTRAR
    ]),
    canAccessAnalytics: () => hasAnyRole([
      ROLES.SUPER_ADMIN, 
      ROLES.STATE_ADMIN, 
      ROLES.BRANCH_ADMIN, 
      ROLES.ZONAL_ADMIN
    ])
  };

  return permissions;
};

export default usePermissions;
