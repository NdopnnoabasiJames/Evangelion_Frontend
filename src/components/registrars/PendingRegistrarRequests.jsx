import React, { useState, useEffect } from 'react';
import { registrarApprovalService } from '../../services/registrarVolunteerService';
import { ErrorDisplay, LoadingCard } from '../common/Loading';
import { toast } from 'react-toastify';

const PendingRegistrarRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const data = await registrarApprovalService.getPendingVolunteerRequests();
      setPendingRequests(data || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId, registrarId, requestId) => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: 'approving' }));
      await registrarApprovalService.approveVolunteerRequest(eventId, registrarId);
      toast.success('Registrar request approved successfully');
      await fetchPendingRequests(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleReject = async (eventId, registrarId, requestId, reason) => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));
      await registrarApprovalService.rejectVolunteerRequest(eventId, registrarId, reason);
      toast.success('Registrar request rejected successfully');
      await fetchPendingRequests(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
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
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Pending Registrar Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and approve registrar volunteer requests for events in your branch.
          </p>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            No pending registrar requests at this time.
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {pendingRequests.map((request) => (
              <li key={request.requestId} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {request.registrar?.name?.charAt(0) || 'R'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {request.registrar?.name || 'Unknown Registrar'}
                          </p>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            {request.registrar?.email}
                          </p>
                          {request.registrar?.phone && (
                            <p className="text-sm text-gray-600">
                              {request.registrar.phone}
                            </p>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">
                            Event: {request.event?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Date: {formatDate(request.event?.date)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Requested: {formatDate(request.requestedAt)}
                          </p>
                        </div>
                        {request.registrar?.branch && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Branch: {request.registrar.branch.name || request.registrar.branch}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(request.event.id, request.registrar._id, request.requestId)}
                      disabled={processing[request.requestId]}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {processing[request.requestId] === 'approving' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection (optional):');
                        if (reason !== null) { // User didn't cancel
                          handleReject(request.event.id, request.registrar._id, request.requestId, reason);
                        }
                      }}
                      disabled={processing[request.requestId]}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {processing[request.requestId] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PendingRegistrarRequests;
