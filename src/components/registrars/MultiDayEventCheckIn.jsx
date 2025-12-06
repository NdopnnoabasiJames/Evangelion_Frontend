import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { registrarVolunteerService } from '../../services/registrarVolunteerService';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';
import Layout from '../Layout/Layout';
import { ErrorDisplay, LoadingCard } from '../common/Loading';
import { toast } from 'react-hot-toast';

const MultiDayEventCheckIn = () => {
  const { eventId } = useParams();
  const [guests, setGuests] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState({});
  const [error, setError] = useState(null);
  const { execute: fetchEvent } = useApi(null, { immediate: false });
  const { execute: checkInDailyGuest } = useApi(null, { immediate: false });

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
      fetchGuests();
    }
  }, [eventId]);

  useEffect(() => {
    if (selectedDate && (eventDetails?.eventType === 'multi-day' || eventDetails?.eventType === 'multi-day-specific')) {
      fetchGuests();
    }
  }, [selectedDate]);

  const loadEventDetails = async () => {
    try {
      const event = await fetchEvent(`${API_ENDPOINTS.EVENTS.BASE}/${eventId}`);
      setEventDetails(event);
      
      // Set today as default date if it's within the event dates
      if (event.eventType === 'multi-day' || event.eventType === 'multi-day-specific') {
        const today = new Date().toISOString().split('T')[0];
        const eventDates = getEventDatesFromEvent(event);
        
        if (eventDates.includes(today)) {
          setSelectedDate(today);
        } else if (eventDates.length > 0) {
          setSelectedDate(eventDates[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load event details:', error);
      setError('Failed to load event details');
    }
  };

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const data = await registrarVolunteerService.getEventGuests(eventId);
      setGuests(data || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      setSearching(true);
      const results = await registrarVolunteerService.searchGuestsByPhone(eventId, searchPhone);
      if (results && results.length > 0) {
        setGuests(results);
        toast.success(`Found ${results.length} guest(s)`);
      } else {
        toast.info('No guests found with that phone number');
        setGuests([]);
      }
    } catch (err) {
      toast.error('Failed to search guests');
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async (guestId, guestName) => {
    try {
      setCheckingIn(prev => ({ ...prev, [guestId]: true }));
      
      if ((eventDetails?.eventType === 'multi-day' || eventDetails?.eventType === 'multi-day-specific') && selectedDate) {
        // For multi-day events, use the new daily check-in endpoint
        await checkInDailyGuest(`/api/guests/${guestId}/daily-checkin`, {
          method: 'POST',
          body: {
            eventId,
            date: selectedDate,
            notes: `Checked in on ${formatDate(selectedDate)}`
          }
        });
        toast.success(`${guestName} checked in for ${formatDate(selectedDate)}`);
      } else {
        // For single-day events, use the existing check-in method
        await registrarVolunteerService.checkInGuest(eventId, guestId);
        toast.success(`${guestName} checked in successfully`);
      }
      
      // Refresh the guests list
      await fetchGuests();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to check in ${guestName}`);
    } finally {
      setCheckingIn(prev => ({ ...prev, [guestId]: false }));
    }
  };

  const getEventDates = () => {
    if (!eventDetails) return [];
    return getEventDatesFromEvent(eventDetails);
  };

  const getEventDatesFromEvent = (event) => {
    if (!event) return [];
    
    if (event.eventType === 'multi-day-specific') {
      // For specific dates, return the array of dates
      return (event.specificDates || []).map(date => 
        new Date(date).toISOString().split('T')[0]
      ).sort();
    } else if (event.eventType === 'multi-day') {
      // For consecutive multi-day events, generate date range
      const dates = [];
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      
      return dates;
    }
    
    return [];
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const isGuestCheckedInForDate = (guest, date) => {
    if (eventDetails?.eventType === 'single-day') {
      return guest.checkedIn;
    }
    
    // For multi-day events, check if guest is checked in for the specific date
    return guest.dailyCheckIns?.some(checkIn => 
      checkIn.date === date && checkIn.checkedIn
    );
  };

  const getCheckInTimeForDate = (guest, date) => {
    if (eventDetails?.eventType === 'single-day') {
      return guest.checkedInTime;
    }
    
    // For multi-day events, get check-in time for specific date
    const dayCheckIn = guest.dailyCheckIns?.find(checkIn => 
      checkIn.date === date && checkIn.checkedIn
    );
    return dayCheckIn?.checkedInTime;
  };

  if (loading && !eventDetails) return <LoadingCard />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Event Check-In - {eventDetails?.name}
          </h1>
          <div className="mt-2 flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              eventDetails?.eventType === 'multi-day' || eventDetails?.eventType === 'multi-day-specific'
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {eventDetails?.eventType === 'multi-day' ? 'Multi-Day Event' 
                : eventDetails?.eventType === 'multi-day-specific' ? 'Multi-Day Event (Specific Dates)'
                : 'Single Day Event'}
            </span>
            <span className="text-gray-600">
              {eventDetails?.eventType === 'multi-day'
                ? `${formatDate(eventDetails.startDate)} - ${formatDate(eventDetails.endDate)}`
                : eventDetails?.eventType === 'multi-day-specific'
                ? `${getEventDates().length} specific dates`
                : formatDate(eventDetails?.date)
              }
            </span>
          </div>
        </div>

        {/* Date Selection for Multi-day Events */}
        {(eventDetails?.eventType === 'multi-day' || eventDetails?.eventType === 'multi-day-specific') && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Check-in Date</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {getEventDates().map(date => {
                const isToday = date === new Date().toISOString().split('T')[0];
                const isPast = new Date(date) < new Date().setHours(0, 0, 0, 0);
                
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      selectedDate === date
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isPast
                        ? 'bg-gray-100 text-gray-500 border-gray-200'
                        : isToday
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      {isToday && <span className="block text-green-600">Today</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Search Guests</h2>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Enter phone number..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={fetchGuests}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Show All
            </button>
          </form>
        </div>

        {/* Guests List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center justify-between">
              <span>
                Guests ({guests.length})
                {(eventDetails?.eventType === 'multi-day' || eventDetails?.eventType === 'multi-day-specific') && selectedDate && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    for {formatDate(selectedDate)}
                  </span>
                )}
              </span>
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
            </h2>
          </div>

          {guests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                No guests found. Use the search above to find guests by phone number.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {guests.map((guest) => {
                const isCheckedIn = isGuestCheckedInForDate(guest, selectedDate);
                const checkInTime = getCheckInTimeForDate(guest, selectedDate);
                
                return (
                  <div key={guest._id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-sm">
                              {guest.name?.charAt(0) || 'G'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {guest.name}
                            </p>
                            {isCheckedIn && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Checked In
                              </span>
                            )}
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-gray-600">{guest.phone}</p>
                            {guest.email && (
                              <p className="text-sm text-gray-600">{guest.email}</p>
                            )}
                            {checkInTime && (
                              <p className="text-sm text-green-600">
                                Checked in: {formatDateTime(checkInTime)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      {isCheckedIn ? (
                        <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100">
                          ✓ Checked In
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(guest._id, guest.name)}
                          disabled={checkingIn[guest._id]}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {checkingIn[guest._id] ? 'Checking In...' : 'Check In'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MultiDayEventCheckIn;