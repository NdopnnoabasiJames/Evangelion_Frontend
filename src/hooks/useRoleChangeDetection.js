import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

// Custom hook to detect role changes and force logout
export const useRoleChangeDetection = (intervalMs = 30000) => { // Check every 30 seconds
  const { isAuthenticated, checkRoleChange } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up periodic role change detection
    intervalRef.current = setInterval(async () => {
      try {
        await checkRoleChange();
      } catch (error) {
        console.error('Error during role change detection:', error);
      }
    }, intervalMs);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, checkRoleChange, intervalMs]);

  // Also provide a manual trigger for immediate role check
  const triggerRoleCheck = async () => {
    if (isAuthenticated) {
      return await checkRoleChange();
    }
    return false;
  };

  return {
    triggerRoleCheck
  };
};
