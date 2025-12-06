/**
 * Utility functions for formatting dates across different event types
 */

/**
 * Safely format a date with fallback for invalid dates
 */
export const safeFormatDate = (dateValue) => {
  if (!dateValue) return 'No date';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString();
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format event date based on event type
 * Handles single-day, multi-day, and multi-day-specific events
 */
export const formatEventDate = (event) => {
  if (!event) return 'No event data';

  switch (event.eventType) {
    case 'multi-day':
      if (event.startDate && event.endDate) {
        const startFormatted = safeFormatDate(event.startDate);
        const endFormatted = safeFormatDate(event.endDate);
        return `${startFormatted} - ${endFormatted}`;
      } else if (event.startDate) {
        return safeFormatDate(event.startDate);
      }
      break;

    case 'multi-day-specific':
      if (event.specificDates && Array.isArray(event.specificDates) && event.specificDates.length > 0) {
        const formattedDates = event.specificDates
          .map(date => safeFormatDate(date))
          .filter(date => date !== 'Invalid date' && date !== 'No date');
        
        if (formattedDates.length > 0) {
          return formattedDates.join(', ');
        }
      }
      return 'No dates specified';

    case 'single-day':
    default:
      if (event.date) {
        return safeFormatDate(event.date);
      } else if (event.startDate) {
        // Fallback for events that might have startDate instead of date
        return safeFormatDate(event.startDate);
      }
      break;
  }

  return 'Date not available';
};

/**
 * Get the earliest date from an event (for sorting/filtering)
 */
export const getEventStartDate = (event) => {
  if (!event) return null;

  switch (event.eventType) {
    case 'multi-day':
      return event.startDate ? new Date(event.startDate) : (event.date ? new Date(event.date) : null);

    case 'multi-day-specific':
      if (event.specificDates && Array.isArray(event.specificDates) && event.specificDates.length > 0) {
        const validDates = event.specificDates
          .map(date => {
            try {
              const d = new Date(date);
              return isNaN(d.getTime()) ? null : d;
            } catch {
              return null;
            }
          })
          .filter(date => date !== null);
        
        if (validDates.length > 0) {
          return new Date(Math.min(...validDates));
        }
      }
      break;

    case 'single-day':
    default:
      if (event.date) {
        try {
          const date = new Date(event.date);
          return isNaN(date.getTime()) ? null : date;
        } catch {
          return null;
        }
      }
      break;
  }

  return null;
};

/**
 * Get the latest date from an event (for sorting/filtering)
 */
export const getEventEndDate = (event) => {
  if (!event) return null;

  switch (event.eventType) {
    case 'multi-day':
      return event.endDate ? new Date(event.endDate) : (event.startDate ? new Date(event.startDate) : (event.date ? new Date(event.date) : null));

    case 'multi-day-specific':
      if (event.specificDates && Array.isArray(event.specificDates) && event.specificDates.length > 0) {
        const validDates = event.specificDates
          .map(date => {
            try {
              const d = new Date(date);
              return isNaN(d.getTime()) ? null : d;
            } catch {
              return null;
            }
          })
          .filter(date => date !== null);
        
        if (validDates.length > 0) {
          return new Date(Math.max(...validDates));
        }
      }
      break;

    case 'single-day':
    default:
      if (event.date) {
        try {
          const date = new Date(event.date);
          return isNaN(date.getTime()) ? null : date;
        } catch {
          return null;
        }
      }
      break;
  }

  return null;
};

/**
 * Check if an event is upcoming (hasn't ended yet)
 */
export const isEventUpcoming = (event) => {
  if (!event) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const endDate = getEventEndDate(event);
  if (!endDate) return false;

  const eventEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return eventEndDay >= today;
};