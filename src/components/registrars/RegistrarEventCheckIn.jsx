import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { registrarVolunteerService } from '../../services/registrarVolunteerService';
import Layout from '../Layout/Layout';
import { ErrorDisplay, LoadingCard } from '../common/Loading';
import { toast } from 'react-hot-toast';

const RegistrarEventCheckIn = () => {
  const { eventId } = useParams();
  const [guests, setGuests] = useState([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (eventId) {
      fetchGuests();
    }
  }, [eventId]);

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

  const handleCheckIn = async (guestId) => {
    try {
      setCheckingIn(prev => ({ ...prev, [guestId]: true }));
      await registrarVolunteerService.checkInGuest(eventId, guestId);
      toast.success('Guest checked in successfully');
      // Refresh the guests list
      await fetchGuests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check in guest');
    } finally {
      setCheckingIn(prev => ({ ...prev, [guestId]: false }));
    }
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
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Event Check-In</h1>
          <p className="mt-2 text-gray-600">Check in guests for this event</p>
        </div>

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
            <h2 className="text-lg font-medium text-gray-900">
              Guests ({guests.length})
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
              {guests.map((guest) => (
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
                          {guest.isCheckedIn && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Checked In
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">{guest.email}</p>
                          <p className="text-sm text-gray-600">{guest.phone}</p>
                          {guest.checkedInAt && (
                            <p className="text-sm text-gray-500">
                              Checked in: {formatDate(guest.checkedInAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    {guest.isCheckedIn ? (
                      <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100">
                        ✓ Checked In
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(guest._id)}
                        disabled={checkingIn[guest._id]}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {checkingIn[guest._id] ? 'Checking In...' : 'Check In'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RegistrarEventCheckIn;
