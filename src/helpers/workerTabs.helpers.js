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
  return event.location || 'Location TBD';
};

export const formatEventDateTime = (event) => {
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
