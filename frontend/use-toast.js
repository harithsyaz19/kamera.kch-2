import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/context/AuthContext';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';
import { ChevronLeft, Check, Info } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const calendarClassNames = {
  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
  month: "space-y-4 w-full",
  caption: "flex justify-center pt-1 relative items-center text-neutral-900",
  caption_label: "text-sm font-semibold",
  nav: "space-x-1 flex items-center",
  nav_button: "h-7 w-7 bg-transparent p-0 text-neutral-500 hover:text-[#6B0F1A]",
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  table: "w-full border-collapse space-y-1",
  head_row: "flex w-full",
  head_cell: "text-neutral-500 rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
  row: "flex w-full mt-2",
  cell: "text-center text-sm p-0 relative flex-1 [&:has([aria-selected])]:bg-[#6B0F1A]/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
  day: "h-9 w-9 mx-auto p-0 font-normal text-neutral-900 hover:bg-[#6B0F1A]/10 cursor-pointer rounded",
  day_selected: "bg-[#6B0F1A] text-white font-bold hover:bg-[#6B0F1A] hover:text-white focus:bg-[#6B0F1A] focus:text-white",
  day_today: "bg-neutral-100 text-neutral-900 font-bold",
  day_outside: "text-neutral-300",
  day_disabled: "opacity-30 text-neutral-400 line-through pointer-events-none bg-transparent",
  day_range_middle: "aria-selected:bg-[#6B0F1A]/15 aria-selected:text-neutral-900 aria-selected:font-semibold",
  day_hidden: "invisible",
};

export const CameraDetail = () => {
  const { cameraId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [camera, setCamera] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedRange, setSelectedRange] = useState({ from: undefined, to: undefined });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCameraData = async () => {
      try {
        const [cameraRes, availabilityRes] = await Promise.all([
          axios.get(`${API_URL}/api/cameras/${cameraId}`),
          axios.get(`${API_URL}/api/cameras/${cameraId}/availability`),
        ]);
        setCamera(cameraRes.data);
        setBlockedDates(availabilityRes.data.blocked_dates.map((d) => parseISO(d)));
      } catch (e) {
        setError('Camera not found');
      } finally {
        setLoading(false);
      }
    };
    fetchCameraData();
  }, [cameraId]);

  const isDateBlocked = (date) => {
    return blockedDates.some(
      (blockedDate) => format(blockedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const handleSelect = (range) => {
    if (!range) {
      setSelectedRange({ from: undefined, to: undefined });
      return;
    }

    if (range.from && range.to) {
      let currentDate = range.from;
      while (currentDate <= range.to) {
        if (isDateBlocked(currentDate)) {
          setError('One or more dates in your selection are unavailable. Please choose different dates.');
          return;
        }
        currentDate = addDays(currentDate, 1);
      }
    }

    setError('');
    setSelectedRange(range);
  };

  const calculateTotal = () => {
    if (!selectedRange.from || !selectedRange.to || !camera) return 0;
    const days = differenceInDays(selectedRange.to, selectedRange.from) + 1;
    return days * camera.daily_rate;
  };

  const handleContinue = () => {
    if (!selectedRange.from || !selectedRange.to) {
      setError('Please select start and end dates');
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: `/camera/${cameraId}` } });
      return;
    }

    const bookingData = {
      cameraId,
      startDate: format(selectedRange.from, 'yyyy-MM-dd'),
      endDate: format(selectedRange.to, 'yyyy-MM-dd'),
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    navigate(`/booking/${cameraId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Loading camera details...</div>
      </div>
    );
  }

  if (error && !camera) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-neutral-600 mb-4">{error}</div>
          <Link to="/catalog">
            <button className="bg-[#6B0F1A] text-white font-semibold px-8 py-4 hover:bg-[#4A0A12]">
              Back to Catalog
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const days = selectedRange.from && selectedRange.to 
    ? differenceInDays(selectedRange.to, selectedRange.from) + 1 
    : 0;
  const total = calculateTotal();
  const deposit = total * 0.5;

  return (
    <div className="min-h-screen bg-white" data-testid="camera-detail-page">
      <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto py-8 md:py-12">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-[#6B0F1A] mb-8 font-medium"
          data-testid="back-to-catalog"
        >
          <ChevronLeft size={20} />
          Back to Catalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="aspect-[4/3] bg-neutral-50 mb-6 overflow-hidden border border-neutral-200">
              <img
                src={camera.image_url}
                alt={camera.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-3">
              {camera.brand} · {camera.model}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4" data-testid="camera-name">
              {camera.name}
            </h1>
            <p className="text-neutral-600 leading-relaxed mb-6">
              {camera.specs}
            </p>
            
            <div className="bg-[#FAF7F2] border border-neutral-200 p-6">
              <div className="flex items-baseline justify-between mb-4">
                <div className="text-sm text-neutral-600 uppercase tracking-widest font-semibold">Daily Rate</div>
                <div className="text-3xl font-bold text-[#6B0F1A]" data-testid="camera-rate">RM{camera.daily_rate}</div>
              </div>
              <div className="space-y-2 text-sm text-neutral-700">
                <div className="flex items-center gap-2"><Check size={16} className="text-[#6B0F1A]" /> 50% deposit to secure booking</div>
                <div className="flex items-center gap-2"><Check size={16} className="text-[#6B0F1A]" /> Self-pickup available (free)</div>
                <div className="flex items-center gap-2"><Check size={16} className="text-[#6B0F1A]" /> COD service +RM15</div>
                <div className="flex items-center gap-2"><Check size={16} className="text-[#6B0F1A]" /> Balance paid on collection</div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white border border-neutral-200 p-6 md:p-8 lg:sticky lg:top-32">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2" data-testid="availability-heading">
                Check Availability
              </h2>
              <p className="text-sm text-neutral-600 mb-6">
                Select your rental dates. Unavailable dates are shown with a line-through.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 text-sm" data-testid="booking-error">
                  {error}
                </div>
              )}

              <div className="border border-neutral-200 p-3 bg-white" data-testid="booking-calendar">
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={handleSelect}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date < today) return true;
                    return isDateBlocked(date);
                  }}
                  numberOfMonths={1}
                  classNames={calendarClassNames}
                />
              </div>

              <div className="flex items-center gap-4 mt-4 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#6B0F1A]"></span>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 line-through text-neutral-400">15</span>
                  <span>Booked</span>
                </div>
              </div>

              {selectedRange.from && selectedRange.to && (
                <div className="mt-6 border-t border-neutral-200 pt-6" data-testid="booking-summary">
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Pickup:</span>
                      <span className="font-semibold text-neutral-900">{format(selectedRange.from, 'EEE, MMM dd')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Return:</span>
                      <span className="font-semibold text-neutral-900">{format(selectedRange.to, 'EEE, MMM dd')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Duration:</span>
                      <span className="font-semibold text-neutral-900">{days} day{days !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="bg-[#FAF7F2] p-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Rental ({days} × RM{camera.daily_rate})</span>
                      <span className="font-semibold text-neutral-900">RM{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t border-neutral-300 pt-2 mt-2">
                      <span className="text-neutral-900">Total Rental:</span>
                      <span className="text-neutral-900" data-testid="booking-total">RM{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-neutral-300">
                      <span className="text-[#6B0F1A] font-semibold">Booking Deposit (50%):</span>
                      <span className="text-[#6B0F1A] font-bold">RM{deposit.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-neutral-600 mb-4">
                    <Info size={14} className="mt-0.5 flex-shrink-0" />
                    <p>You pay 50% deposit now to secure your booking. The remaining RM{deposit.toFixed(2)} is paid on pickup.</p>
                  </div>
                  <button
                    onClick={handleContinue}
                    className="w-full bg-[#6B0F1A] text-white font-semibold px-8 py-4 hover:bg-[#4A0A12]"
                    data-testid="continue-booking-button"
                  >
                    Continue to Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
