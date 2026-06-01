import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { Calendar, Check, Clock, X, Upload } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  pending_payment: { label: 'Awaiting Payment', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  payment_review: { label: 'Payment Review', icon: Upload, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  confirmed: { label: 'Confirmed', icon: Check, color: 'text-green-700 bg-green-50 border-green-200' },
  active: { label: 'Active', icon: Check, color: 'text-green-700 bg-green-50 border-green-200' },
  completed: { label: 'Completed', icon: Check, color: 'text-neutral-700 bg-neutral-50 border-neutral-200' },
  cancelled: { label: 'Cancelled', icon: X, color: 'text-red-700 bg-red-50 border-red-200' },
};

export const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/bookings`, { withCredentials: true })
      .then(({ data }) => setBookings(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="my-bookings-page">
      <div className="bg-[#FAF7F2] border-b border-neutral-200 py-12">
        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-3">Account</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900" data-testid="my-bookings-heading">My Bookings</h1>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-16 max-w-5xl mx-auto py-12">
        {bookings.length === 0 ? (
          <div className="border border-neutral-200 p-12 text-center" data-testid="no-bookings">
            <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-900 mb-2">No bookings yet</h3>
            <p className="text-neutral-600 mb-6">Start by browsing our camera fleet.</p>
            <Link to="/catalog">
              <button className="bg-[#6B0F1A] text-white font-semibold px-8 py-4 hover:bg-[#4A0A12]">
                Browse Cameras
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const config = statusConfig[booking.status] || statusConfig.pending_payment;
              const Icon = config.icon;
              return (
                <div
                  key={booking.id}
                  className="border border-neutral-200 bg-white p-5 md:p-6"
                  data-testid={`booking-${booking.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1 border ${config.color} mb-3`}>
                        <Icon size={14} />
                        {config.label}
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-1">{booking.camera_name}</h3>
                      <div className="text-sm text-neutral-600 space-y-0.5">
                        <div>
                          {format(parseISO(booking.start_date), 'MMM dd, yyyy')} - {format(parseISO(booking.end_date), 'MMM dd, yyyy')}
                          <span className="text-neutral-400"> · {booking.days} day{booking.days !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          Booked: {format(parseISO(booking.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="md:text-right flex md:flex-col gap-4 md:gap-2 items-center md:items-end">
                      <div>
                        <div className="text-2xl font-bold text-[#6B0F1A]">RM{booking.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-neutral-500">Deposit: RM{booking.deposit_amount.toFixed(2)}</div>
                      </div>
                      {booking.status === 'pending_payment' && (
                        <Link to={`/payment/${booking.id}`}>
                          <button className="bg-[#6B0F1A] text-white font-semibold px-4 py-2 text-sm hover:bg-[#4A0A12]">
                            Complete Payment
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
