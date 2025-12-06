import React, { useState, useEffect } from 'react';
import { registrarVolunteerService } from '../../services/registrarVolunteerService';
import { ErrorDisplay, LoadingCard } from '../common/Loading';
import { toast } from 'react-toastify';

const RegistrarVolunteerEvents = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [volunteering, setVolunteering] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [allEventsData, myEventsData] = await Promise.all([
        registrarVolunteerService.getAllEvents(),
        registrarVolunteerService.getMyEvents()
      ]);
      setAllEvents(allEventsData || []);
      setMyEvents(myEventsData || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteer = async (eventId) => {
    try {
      setVolunteering(prev => ({ ...prev, [eventId]: true }));
      const result = await registrarVolunteerService.volunteerForEvent(eventId);
      
      if (result.status === 'approved') {
        toast.success(result.message);
        // Refresh events to update status
        await fetchEvents();
      } else {
        toast.success(result.message);
      }
      
      // Refresh the events list to show updated status
      await fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to volunteer for event');
    } finally {
      setVolunteering(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const getVolunteerStatus = (event) => {
    const request = event.registrarRequests?.find(req => req.registrarId);
    if (!request) return null;
    return request.status;
  };

  const getVolunteerButtonText = (event) => {
    const status = getVolunteerStatus(event);
    switch (status) {
      case 'approved':
        return 'Approved ✓';
      case 'pending':
        return 'Pending...';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Volunteer';
    }
  };

  const getVolunteerButtonClass = (event) => {
    const status = getVolunteerStatus(event);
    switch (status) {
      case 'approved':
        return 'bg-green-600 hover:bg-green-700 cursor-default';
      case 'pending':
        return 'bg-yellow-600 hover:bg-yellow-700 cursor-default';
      case 'rejected':
        return 'bg-red-600 hover:bg-red-700 cursor-default';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  const canVolunteer = (event) => {
    const status = getVolunteerStatus(event);
    return !status; // Only if no existing request
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) return <LoadingCard />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Events ({allEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Events ({myEvents.length})
          </button>
        </nav>
      </div>

      {/* Events List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(activeTab === 'all' ? allEvents : myEvents).map((event) => (
          <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {event.name}
              </h3>
              
              {event.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {event.description}
                </p>
              )}

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="font-medium">Date:</span>
                  <span className="ml-2">{formatDate(event.date)}</span>
                </div>
                
                {event.selectedBranches && event.selectedBranches.length > 0 && (
                  <div className="flex items-center">
                    <span className="font-medium">Branches:</span>
                    <span className="ml-2">
                      {event.selectedBranches.map(branch => branch.name).join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex items-center">
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    event.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>

              {activeTab === 'all' && (
                <div className="mt-4">
                  <button
                    onClick={() => handleVolunteer(event._id)}
                    disabled={!canVolunteer(event) || volunteering[event._id]}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${getVolunteerButtonClass(event)} ${
                      !canVolunteer(event) ? 'opacity-75' : ''
                    }`}
                  >
                    {volunteering[event._id] ? 'Processing...' : getVolunteerButtonText(event)}
                  </button>
                </div>
              )}

              {activeTab === 'my' && (
                <div className="mt-4">
                  <button
                    onClick={() => window.location.href = `/events/${event._id}/checkin`}
                    className="w-full py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                  >
                    Check-in Guests
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(activeTab === 'all' ? allEvents : myEvents).length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {activeTab === 'all' 
              ? 'No events available for volunteering' 
              : 'You have not volunteered for any events yet'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarVolunteerEvents;
