import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO } from 'date-fns';
import { Check, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Checkout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('FPX');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [qrPaymentId, setQrPaymentId] = useState(null);
  const [pollingStatus, setPollingStatus] = useState('idle');
  const pollingRef = useRef(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/bookings/${bookingId}`, {
          withCredentials: true,
        });
        setBooking(data);
      } catch (e) {
        console.error('Error fetching booking:', e);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, navigate]);

  useEffect(() => {
    if (!qrPaymentId || !qrDialogOpen) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const startPolling = () => {
      pollingRef.current = setInterval(async () => {
        try {
          const { data } = await axios.get(`${API_URL}/api/payments/${qrPaymentId}`, {
            withCredentials: true,
          });

          if (data.status === 'succeeded') {
            setPollingStatus('succeeded');
            setQrDialogOpen(false);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            navigate(`/payment-result?payment_id=${qrPaymentId}&status=success`);
          } else if (data.status === 'failed' || data.status === 'expired') {
            setPollingStatus('failed');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          } else {
            setPollingStatus('pending');
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 3000);
    };

    startPolling();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [qrPaymentId, qrDialogOpen, navigate]);

  const handlePayment = async () => {
    setPaymentLoading(true);

    try {
      if (paymentMethod === 'FPX') {
        const { data } = await axios.post(
          `${API_URL}/api/payments/fpx/start`,
          {
            booking_id: bookingId,
            method: 'FPX',
          },
          { withCredentials: true }
        );
        window.location.href = data.redirect_url;
      } else if (paymentMethod === 'DUITNOW_QR') {
        const { data } = await axios.post(
          `${API_URL}/api/payments/duitnow-qr/start`,
          {
            booking_id: bookingId,
            method: 'DUITNOW_QR',
          },
          { withCredentials: true }
        );
        setQrImage(`data:image/png;base64,${data.qr_image_base64}`);
        setQrPaymentId(data.id);
        setQrDialogOpen(true);
      }
    } catch (e) {
      console.error('Payment error:', e);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleMockPayment = async (success) => {
    if (!qrPaymentId) return;

    try {
      await axios.post(
        `${API_URL}/api/payments/${qrPaymentId}/mock-complete?success=${success}`
      );
      
      if (success) {
        setPollingStatus('succeeded');
        setQrDialogOpen(false);
        navigate(`/payment-result?payment_id=${qrPaymentId}&status=success`);
      } else {
        setPollingStatus('failed');
      }
    } catch (e) {
      console.error('Mock payment error:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white/70">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="checkout-page">
      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-12" data-testid="checkout-heading">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border border-white/10 bg-[#0A0A0A] p-8" data-testid="booking-details">
              <h2 className="text-2xl font-bold text-white mb-6">Booking Details</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-white/50 text-sm mb-1">Camera</div>
                  <div className="text-white font-bold text-lg">{booking.camera_name}</div>
                </div>
                <div>
                  <div className="text-white/50 text-sm mb-1">Rental Period</div>
                  <div className="text-white font-bold">
                    {format(parseISO(booking.start_date), 'MMM dd, yyyy')} -{' '}
                    {format(parseISO(booking.end_date), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-white/50 text-sm mb-1">Total Amount</div>
                  <div className="text-white font-bold text-2xl" data-testid="checkout-total">
                    RM {booking.total_amount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-[#0A0A0A] p-8" data-testid="payment-section">
              <h2 className="text-2xl font-bold text-white mb-6">Payment Method</h2>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4 mb-8">
                <div className="flex items-center space-x-3" data-testid="payment-method-fpx">
                  <RadioGroupItem value="FPX" id="fpx" className="border-white/20 text-blue-300" />
                  <Label
                    htmlFor="fpx"
                    className="text-white cursor-pointer flex-1 py-3 px-4 border border-white/10 hover:border-white/30"
                  >
                    <div className="font-bold">FPX Online Banking</div>
                    <div className="text-sm text-white/50">Pay via Malaysian online banking</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3" data-testid="payment-method-qr">
                  <RadioGroupItem value="DUITNOW_QR" id="duitnow" className="border-white/20 text-blue-300" />
                  <Label
                    htmlFor="duitnow"
                    className="text-white cursor-pointer flex-1 py-3 px-4 border border-white/10 hover:border-white/30"
                  >
                    <div className="font-bold">DuitNow QR</div>
                    <div className="text-sm text-white/50">Scan QR code to pay</div>
                  </Label>
                </div>
              </RadioGroup>

              <Button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full bg-white text-black font-bold px-8 py-4 hover:bg-gray-200"
                data-testid="pay-now-button"
              >
                {paymentLoading ? 'Processing...' : `Pay RM ${booking.total_amount.toFixed(2)}`}
              </Button>

              <p className="mt-4 text-xs text-white/40 text-center">
                This is a demo. Payments are simulated for testing purposes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md" data-testid="qr-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Scan QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {qrImage && (
              <div className="flex justify-center bg-white p-4">
                <img src={qrImage} alt="DuitNow QR Code" className="w-64 h-64" data-testid="qr-code-image" />
              </div>
            )}
            <p className="text-white/70 text-center text-sm">
              {pollingStatus === 'pending'
                ? 'Scan the QR code with your banking app to complete payment...'
                : pollingStatus === 'failed'
                ? 'Payment failed. Please try again.'
                : 'Waiting for payment...'}
            </p>

            <div className="border-t border-white/10 pt-4">
              <p className="text-white/50 text-xs text-center mb-4">Demo Controls (Testing Only)</p>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleMockPayment(true)}
                  className="flex-1 bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                  data-testid="mock-success-button"
                >
                  <Check size={18} />
                  Mock Success
                </Button>
                <Button
                  onClick={() => handleMockPayment(false)}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                  data-testid="mock-fail-button"
                >
                  <X size={18} />
                  Mock Fail
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
