// Utility functions for WorkerTabs (formatEventLocation, formatEventDateTime, getVolunteerButtonState)
export const formatEventLocation = (event) => {
  if (event.selectedBranches && event.selectedBranches.length > 0) {
    const branch = event.selectedBranches[0];
    if (branch.stateId && branch.stateId.name && branch.name) {
      return `${branch.stateId.name} State, ${branch.name} Branch`;
    }
    if (branch.name) {
      return `${branch.name} Branch`;
    }
  }
  if (event.scope === 'national') {
    return 'National Event';
  }
  if (event.scope === 'state' && event.availableStates && event.availableStates.length > 0) {
    const state = event.availableStates[0];
    return state.name ? `${state.name} State` : 'State Event';
  }
  if (event.availableStates && event.availableStates.length > 0) {
    if (event.availableStates.length === 1) {
      const state = event.availableStates[0];
      return state.name ? `${state.name} State` : 'State Event';
    }
    return 'Multi-State Event';
  }
  // Handle branch admin events
  if (event.creatorLevel === 'branch_admin') {
    if (event.location) {
      return event.location;
    }
    if (event.availableZones && event.availableZones.length > 0) {
      if (event.availableZones.length === 1) {
        const zone = event.availableZones[0];
        return zone.name ? `${zone.name} Zone` : 'Zone Event';
      }
      return `${event.availableZones.length} Zones`;
    }
  }
  return event.location || 'Location TBD';
};

export const formatEventDateTime = (event) => {
  // Handle multi-day specific dates events
  if (event.eventType === 'multi-day-specific' && event.specificDates) {
    const dates = event.specificDates.map(date => new Date(date));
    const sortedDates = dates.sort((a, b) => a - b);
    
    if (sortedDates.length === 1) {
      const date = sortedDates[0].toLocaleDateString();
      const time = sortedDates[0].toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return { date, time };
    }
    
    // Format multiple specific dates
    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];
    const firstTime = firstDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Show as "Dec 9, 11, 15" or "Dec 9, Jan 11, Feb 15"
    const formattedDates = sortedDates.map(date => {
      const month = date.toLocaleDateString([], { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    }).join(', ');
    
    return { 
      date: formattedDates, 
      time: firstTime 
    };
  }
  
  // Handle multi-day consecutive events
  if (event.eventType === 'multi-day' && (event.startDate || event.endDate)) {
    const startDate = event.startDate ? new Date(event.startDate) : null;
    const endDate = event.endDate ? new Date(event.endDate) : null;
    
    if (startDate && endDate) {
      const startDateStr = startDate.toLocaleDateString();
      const endDateStr = endDate.toLocaleDateString();
      const startTime = startDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      const endTime = endDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      // If same day, show date once with time range
      if (startDateStr === endDateStr) {
        return { 
          date: startDateStr, 
          time: `${startTime} - ${endTime}` 
        };
      }
      
      // Different days, show date range
      return { 
        date: `${startDateStr} - ${endDateStr}`, 
        time: `${startTime} - ${endTime}` 
      };
    } else if (startDate) {
      const date = startDate.toLocaleDateString();
      const time = startDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return { date: `${date} (Start)`, time };
    } else if (endDate) {
      const date = endDate.toLocaleDateString();
      const time = endDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return { date: `${date} (End)`, time };
    }
  }
  
  // Handle single-day events
  if (event.date) {
    const eventDate = new Date(event.date);
    const date = eventDate.toLocaleDateString();
    const time = eventDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return { date, time };
  }
  
  return { date: 'Date TBD', time: 'Time TBD' };
};

export const getVolunteerButtonState = (event, user) => {
  if (!user || !event) return { text: 'Volunteer', disabled: false, variant: 'primary' };
  if (event.workers && event.workers.some(worker => 
    (typeof worker === 'object' ? worker._id : worker) === user._id
  )) {
    return { text: 'Volunteered', disabled: true, variant: 'success' };
  }
  if (event.volunteerRequests && event.volunteerRequests.length > 0) {
    const userRequest = event.volunteerRequests.find(req => 
      (typeof req.workerId === 'object' ? req.workerId._id : req.workerId) === user._id
    );
    if (userRequest) {
      switch (userRequest.status) {
        case 'pending':
          return { text: 'Pending', disabled: true, variant: 'warning' };
        case 'approved':
          return { text: 'Volunteered', disabled: true, variant: 'success' };
        case 'rejected':
          return { text: 'Rejected', disabled: true, variant: 'danger' };
        default:
          return { text: 'Volunteer', disabled: false, variant: 'primary' };
      }
    }
  }
  return { text: 'Volunteer', disabled: false, variant: 'primary' };
};
