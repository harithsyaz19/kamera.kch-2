import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { Camera, Calendar, DollarSign, Users, Eye, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuthImage } from '@/components/AuthImage';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const statusOptions = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'payment_review', label: 'Payment Review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const getStatusColorClass = (status) => {
  if (['confirmed', 'active', 'completed'].includes(status)) {
    return 'bg-green-50 text-green-700 border border-green-200';
  }
  if (status === 'payment_review') {
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
  if (status === 'pending_payment') {
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }
  return 'bg-red-50 text-red-700 border border-red-200';
};

export const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [bookingsRes, camerasRes] = await Promise.all([
        axios.get(`${API_URL}/api/bookings`, { withCredentials: true }),
        axios.get(`${API_URL}/api/cameras`),
      ]);
      setBookings(bookingsRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setCameras(camerasRes.data);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Admin fetchData failed:', e?.message || e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/api/bookings/${bookingId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchData();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const totalRevenue = bookings
    .filter((b) => ['confirmed', 'active', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + b.total_amount, 0);
  const confirmedBookings = bookings.filter((b) => ['confirmed', 'active', 'completed'].includes(b.status)).length;
  const pendingReview = bookings.filter((b) => b.status === 'payment_review').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="admin-dashboard">
      <div className="bg-[#FAF7F2] border-b border-neutral-200 py-10">
        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-3">Admin Panel</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900" data-testid="admin-heading">Dashboard</h1>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="border border-neutral-200 p-6" data-testid="stat-cameras">
            <Camera className="w-7 h-7 text-[#6B0F1A] mb-3" />
            <div className="text-3xl font-bold text-neutral-900 mb-1">{cameras.length}</div>
            <div className="text-neutral-600 text-sm">Cameras</div>
          </div>
          <div className="border border-neutral-200 p-6" data-testid="stat-bookings">
            <Calendar className="w-7 h-7 text-[#6B0F1A] mb-3" />
            <div className="text-3xl font-bold text-neutral-900 mb-1">{bookings.length}</div>
            <div className="text-neutral-600 text-sm">Total Bookings</div>
          </div>
          <div className="border border-neutral-200 p-6" data-testid="stat-confirmed">
            <Users className="w-7 h-7 text-green-700 mb-3" />
            <div className="text-3xl font-bold text-neutral-900 mb-1">{confirmedBookings}</div>
            <div className="text-neutral-600 text-sm">Confirmed</div>
          </div>
          <div className="border border-neutral-200 p-6" data-testid="stat-revenue">
            <DollarSign className="w-7 h-7 text-[#6B0F1A] mb-3" />
            <div className="text-3xl font-bold text-neutral-900 mb-1">RM{totalRevenue.toFixed(0)}</div>
            <div className="text-neutral-600 text-sm">Revenue</div>
          </div>
        </div>

        {pendingReview > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 mb-6 flex items-center gap-3">
            <Upload className="text-blue-600" size={20} />
            <span className="text-sm font-semibold text-blue-900">
              {pendingReview} booking{pendingReview !== 1 ? 's' : ''} awaiting payment verification
            </span>
          </div>
        )}

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="bg-neutral-100 border border-neutral-200">
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
            <TabsTrigger value="cameras" data-testid="tab-cameras">Cameras</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            <div className="border border-neutral-200 bg-white overflow-hidden">
              <h2 className="text-xl font-bold text-neutral-900 p-6 border-b border-neutral-200">All Bookings</h2>
              {bookings.length === 0 ? (
                <p className="text-neutral-600 text-center py-12">No bookings yet</p>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-5 md:p-6 hover:bg-neutral-50" data-testid={`admin-booking-${booking.id}`}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`text-xs font-bold uppercase tracking-widest px-2 py-1 ${getStatusColorClass(booking.status)}`}
                            >
                              {booking.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-neutral-900 mb-1">{booking.camera_name}</h3>
                          <div className="text-sm text-neutral-600">
                            {booking.customer_info?.full_name} · {booking.customer_info?.phone}
                          </div>
                          <div className="text-sm text-neutral-600">
                            {format(parseISO(booking.start_date), 'MMM dd')} - {format(parseISO(booking.end_date), 'MMM dd')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xl font-bold text-neutral-900">RM{booking.total_amount.toFixed(2)}</div>
                            <div className="text-xs text-neutral-500">Dep: RM{booking.deposit_amount.toFixed(2)}</div>
                          </div>
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="border border-[#6B0F1A] text-[#6B0F1A] font-semibold px-3 py-2 text-sm hover:bg-[#6B0F1A] hover:text-white flex items-center gap-1"
                            data-testid={`view-booking-${booking.id}`}
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cameras" className="mt-6">
            <div className="border border-neutral-200 bg-white p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-6">Camera Fleet</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cameras.map((camera) => (
                  <div key={camera.id} className="border border-neutral-200 p-4" data-testid={`admin-camera-${camera.id}`}>
                    <div className="aspect-[4/3] bg-neutral-50 mb-3 overflow-hidden">
                      <img src={camera.image_url} alt={camera.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-1">{camera.brand}</div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">{camera.name}</h3>
                    <div className="text-[#6B0F1A] font-bold">RM{camera.daily_rate}/day</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6" data-testid="booking-detail-modal">
              <div className="bg-[#FAF7F2] p-4">
                <div className="text-xs text-neutral-600 uppercase font-bold mb-2">Reference</div>
                <div className="font-mono text-sm break-all">{selectedBooking.id}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-600 uppercase font-bold mb-1">Camera</div>
                  <div className="font-semibold">{selectedBooking.camera_name}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-600 uppercase font-bold mb-1">Rental Period</div>
                  <div className="font-semibold">
                    {format(parseISO(selectedBooking.start_date), 'MMM dd')} - {format(parseISO(selectedBooking.end_date), 'MMM dd, yyyy')} ({selectedBooking.days}d)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-600 uppercase font-bold mb-1">Total</div>
                  <div className="font-semibold text-[#6B0F1A]">RM{selectedBooking.total_amount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-600 uppercase font-bold mb-1">Deposit</div>
                  <div className="font-semibold">RM{selectedBooking.deposit_amount.toFixed(2)}</div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <h3 className="font-bold text-neutral-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-neutral-600">Name:</span> <strong>{selectedBooking.customer_info?.full_name}</strong></div>
                  <div><span className="text-neutral-600">IC:</span> <strong>{selectedBooking.customer_info?.ic_number}</strong></div>
                  <div><span className="text-neutral-600">Phone:</span> <strong>{selectedBooking.customer_info?.phone}</strong></div>
                  <div><span className="text-neutral-600">Emergency:</span> <strong>{selectedBooking.customer_info?.emergency_contact}</strong></div>
                  <div className="md:col-span-2"><span className="text-neutral-600">Social Media:</span> <strong>{selectedBooking.customer_info?.social_media}</strong></div>
                  <div className="md:col-span-2"><span className="text-neutral-600">Address:</span> <strong>{selectedBooking.customer_info?.address}</strong></div>
                </div>
              </div>

              {selectedBooking.customer_info?.ic_photo_front && (
                <div className="border-t border-neutral-200 pt-4">
                  <h3 className="font-bold text-neutral-900 mb-3">IC Photos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-neutral-600 mb-1">Front</div>
                      <AuthImage path={selectedBooking.customer_info.ic_photo_front} alt="IC Front" className="w-full border border-neutral-200" data-testid="ic-front-image" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-600 mb-1">Back</div>
                      <AuthImage path={selectedBooking.customer_info.ic_photo_back} alt="IC Back" className="w-full border border-neutral-200" data-testid="ic-back-image" />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4">
                <h3 className="font-bold text-neutral-900 mb-3">Delivery</h3>
                <div className="text-sm">
                  <div><strong>Method:</strong> {selectedBooking.delivery_method === 'self_pickup' ? 'Self Pickup' : 'COD Delivery (+RM15)'}</div>
                  {selectedBooking.pickup_location && <div><strong>Location:</strong> {selectedBooking.pickup_location}</div>}
                  {selectedBooking.delivery_address && <div><strong>Address:</strong> {selectedBooking.delivery_address}</div>}
                </div>
              </div>

              {selectedBooking.payment_receipt && (
                <div className="border-t border-neutral-200 pt-4">
                  <h3 className="font-bold text-neutral-900 mb-3">Payment Receipt</h3>
                  {selectedBooking.payment_reference && (
                    <div className="text-sm mb-2"><strong>Reference:</strong> {selectedBooking.payment_reference}</div>
                  )}
                  <AuthImage path={selectedBooking.payment_receipt} alt="Receipt" className="w-full max-w-md border border-neutral-200" data-testid="receipt-image" />
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4">
                <h3 className="font-bold text-neutral-900 mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateStatus(selectedBooking.id, option.value)}
                      className={`px-3 py-2 text-sm font-semibold border ${
                        selectedBooking.status === option.value
                          ? 'bg-[#6B0F1A] text-white border-[#6B0F1A]'
                          : 'border-neutral-300 text-neutral-700 hover:border-[#6B0F1A] hover:text-[#6B0F1A]'
                      }`}
                      data-testid={`status-${option.value}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
