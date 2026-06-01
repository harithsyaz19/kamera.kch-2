import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Phone, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const BookingConfirmed = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/bookings/${bookingId}`, { withCredentials: true })
      .then(({ data }) => setBooking(data))
      .catch(() => {});
  }, [bookingId]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-6" data-testid="booking-confirmed-page">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-neutral-200 p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3" data-testid="confirmed-heading">
            Booking Submitted!
          </h1>
          <p className="text-neutral-600 mb-8">
            Your receipt has been uploaded. We'll verify your payment and confirm your booking shortly via WhatsApp.
          </p>

          <div className="bg-[#FAF7F2] border border-neutral-200 p-6 text-left mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-3">Booking Reference</div>
            <div className="text-sm font-mono text-neutral-900 mb-4 break-all" data-testid="booking-id">{booking.id}</div>

            <div className="space-y-2 text-sm border-t border-neutral-200 pt-4">
              <div className="flex justify-between">
                <span className="text-neutral-600">Camera:</span>
                <span className="font-semibold text-neutral-900">{booking.camera_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Dates:</span>
                <span className="font-semibold text-neutral-900">
                  {format(parseISO(booking.start_date), 'MMM dd')} - {format(parseISO(booking.end_date), 'MMM dd')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Method:</span>
                <span className="font-semibold text-neutral-900">
                  {booking.delivery_method === 'self_pickup' ? `Self Pickup - ${booking.pickup_location}` : 'COD Delivery'}
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
                <span className="text-neutral-600">Deposit Paid:</span>
                <span className="font-bold text-[#6B0F1A]">RM{booking.deposit_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Balance on pickup:</span>
                <span className="font-semibold text-neutral-900">RM{booking.balance_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 text-left mb-6">
            <h3 className="font-bold text-neutral-900 mb-2 flex items-center gap-2">
              <Phone size={16} className="text-[#6B0F1A]" />
              What's next?
            </h3>
            <ol className="text-sm text-neutral-700 space-y-1 list-decimal list-inside">
              <li>We'll verify your payment receipt</li>
              <li>You'll receive a WhatsApp confirmation at +60 12-879 7715</li>
              <li>{booking.delivery_method === 'self_pickup' ? 'Pickup at agreed location' : 'We deliver to your address'}</li>
              <li>Pay balance & sign rental agreement on collection</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/my-bookings" className="flex-1">
              <button className="w-full bg-[#6B0F1A] text-white font-semibold px-6 py-3 hover:bg-[#4A0A12]">
                View My Bookings
              </button>
            </Link>
            <a href="https://wa.me/60128797715" target="_blank" rel="noopener noreferrer" className="flex-1">
              <button className="w-full border border-[#6B0F1A] text-[#6B0F1A] font-semibold px-6 py-3 hover:bg-[#6B0F1A] hover:text-white">
                Contact via WhatsApp
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
