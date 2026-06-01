import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { Copy, Upload, Check, AlertCircle, Building2, Phone } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [receiptImage, setReceiptImage] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingRes, businessRes] = await Promise.all([
          axios.get(`${API_URL}/api/bookings/${bookingId}`, { withCredentials: true }),
          axios.get(`${API_URL}/api/business/info`),
        ]);
        setBooking(bookingRes.data);
        setBusinessInfo(businessRes.data);
      } catch (e) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookingId, navigate]);

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setReceiptImage(base64);
      setError('');
    } catch {
      setError('Failed to upload image');
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSubmit = async () => {
    if (!receiptImage) {
      setError('Please upload payment receipt');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axios.post(
        `${API_URL}/api/bookings/${bookingId}/upload-receipt`,
        {
          receipt_image: receiptImage,
          payment_reference: paymentRef,
        },
        { withCredentials: true }
      );
      navigate(`/booking-confirmed/${bookingId}`);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to upload receipt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !booking || !businessInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Loading payment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]" data-testid="payment-page">
      <div className="px-6 md:px-12 lg:px-16 max-w-5xl mx-auto py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2" data-testid="payment-heading">Complete Your Payment</h1>
          <p className="text-neutral-600">Transfer the deposit and upload your receipt to confirm your booking.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-neutral-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#6B0F1A] text-white flex items-center justify-center font-bold">1</div>
                <h2 className="text-xl font-bold text-neutral-900">Transfer Deposit</h2>
              </div>

              <div className="bg-[#FAF7F2] border border-neutral-200 p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <Building2 className="text-[#6B0F1A] mt-1" size={20} />
                  <div className="flex-1">
                    <div className="text-xs text-neutral-600 uppercase tracking-widest font-semibold mb-1">Bank</div>
                    <div className="text-xl font-bold text-neutral-900">{businessInfo.bank_name}</div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4 mb-4">
                  <div className="text-xs text-neutral-600 uppercase tracking-widest font-semibold mb-2">Account Number</div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl md:text-3xl font-bold text-[#6B0F1A] font-mono" data-testid="bank-account">{businessInfo.bank_account}</div>
                    <button
                      onClick={() => handleCopy(businessInfo.bank_account.replace(/ /g, ''), 'account')}
                      className="text-[#6B0F1A] hover:bg-[#6B0F1A]/10 p-2"
                      data-testid="copy-account-button"
                    >
                      {copied === 'account' ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <div className="text-xs text-neutral-600 uppercase tracking-widest font-semibold mb-2">Amount to Transfer</div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl md:text-3xl font-bold text-[#6B0F1A]" data-testid="deposit-amount">RM{booking.deposit_amount.toFixed(2)}</div>
                    <button
                      onClick={() => handleCopy(booking.deposit_amount.toFixed(2), 'amount')}
                      className="text-[#6B0F1A] hover:bg-[#6B0F1A]/10 p-2"
                    >
                      {copied === 'amount' ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">50% of total rental fee — secures your booking</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-neutral-700 bg-blue-50 border border-blue-200 p-4">
                <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p>Transfer the exact amount to the Maybank account above. Take a screenshot or photo of the transfer receipt for upload.</p>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#6B0F1A] text-white flex items-center justify-center font-bold">2</div>
                <h2 className="text-xl font-bold text-neutral-900">Upload Payment Receipt</h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm flex items-start gap-2" data-testid="payment-error">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mb-4">
                <label className="text-sm font-semibold text-neutral-900 mb-2 block">Payment Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Transaction ID / Reference number"
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A]"
                  data-testid="input-payment-ref"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-900 mb-2 block">Receipt Image *</label>
                <label className="border-2 border-dashed border-neutral-300 hover:border-[#6B0F1A] p-6 flex flex-col items-center justify-center cursor-pointer min-h-[200px] transition-colors">
                  {receiptImage ? (
                    <img src={receiptImage} alt="Receipt" className="max-h-[300px] object-contain" data-testid="receipt-preview" />
                  ) : (
                    <>
                      <Upload size={32} className="text-neutral-400 mb-3" />
                      <span className="text-sm font-semibold text-neutral-700">Click to upload receipt</span>
                      <span className="text-xs text-neutral-500 mt-1">PNG, JPG up to 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReceiptUpload}
                    data-testid="input-receipt"
                  />
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !receiptImage}
                className="w-full bg-[#6B0F1A] text-white font-semibold px-8 py-4 hover:bg-[#4A0A12] disabled:opacity-50 mt-6"
                data-testid="submit-receipt-button"
              >
                {submitting ? 'Uploading...' : 'Submit Receipt & Confirm Booking'}
              </button>
            </div>

            <div className="bg-white border border-neutral-200 p-6">
              <div className="flex items-start gap-3">
                <Phone className="text-[#6B0F1A] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-neutral-900 mb-1">Need help?</h3>
                  <p className="text-sm text-neutral-600 mb-2">Contact us if you have any questions about payment.</p>
                  <a
                    href="https://wa.me/60128797715"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6B0F1A] hover:underline font-semibold text-sm"
                  >
                    WhatsApp: +60 12-879 7715
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200 p-6 lg:sticky lg:top-32">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Order Summary</h3>
              <div className="mb-4 pb-4 border-b border-neutral-200">
                <div className="font-bold text-neutral-900">{booking.camera_name}</div>
                <div className="text-sm text-neutral-600">
                  {format(parseISO(booking.start_date), 'MMM dd')} - {format(parseISO(booking.end_date), 'MMM dd')}
                </div>
                <div className="text-sm text-neutral-600">{booking.days} day{booking.days !== 1 ? 's' : ''}</div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Rental</span>
                  <span>RM{booking.rental_amount.toFixed(2)}</span>
                </div>
                {booking.delivery_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">COD Fee</span>
                    <span>RM{booking.delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span>RM{booking.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-4 space-y-2">
                <div className="flex justify-between text-[#6B0F1A] font-bold">
                  <span>Pay Now (50%):</span>
                  <span>RM{booking.deposit_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-600 pt-2 border-t border-neutral-300">
                  <span>Balance on pickup:</span>
                  <span>RM{booking.balance_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
