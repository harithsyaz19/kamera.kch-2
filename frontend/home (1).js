import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ChevronLeft, Check, Upload, Info, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PICKUP_LOCATIONS = [
  'SK Jalan Muara Tuang',
  'Federal Park Matang',
  'Other (subject to approval)',
];

const Step = ({ number, label, active, completed }) => {
  const isHighlighted = completed || active;
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${
          isHighlighted ? 'bg-[#6B0F1A] text-white' : 'bg-neutral-200 text-neutral-500'
        }`}
      >
        {completed ? <Check size={16} /> : number}
      </div>
      <span className={`text-sm font-semibold hidden sm:inline ${isHighlighted ? 'text-neutral-900' : 'text-neutral-500'}`}>
        {label}
      </span>
    </div>
  );
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const Booking = () => {
  const { cameraId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [camera, setCamera] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customerInfo, setCustomerInfo] = useState({
    full_name: user?.name || '',
    ic_number: '',
    phone: '',
    emergency_contact: '',
    social_media: '',
    address: '',
    ic_photo_front: '',
    ic_photo_back: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('self_pickup');
  const [pickupLocation, setPickupLocation] = useState(PICKUP_LOCATIONS[0]);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingBooking');
    if (!stored) {
      navigate(`/camera/${cameraId}`);
      return;
    }
    const data = JSON.parse(stored);
    setPendingBooking(data);

    const fetchCamera = async () => {
      try {
        const { data: cam } = await axios.get(`${API_URL}/api/cameras/${cameraId}`);
        setCamera(cam);
      } catch (e) {
        navigate('/catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchCamera();
  }, [cameraId, navigate]);

  const handleICUpload = async (e, side) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setCustomerInfo({ ...customerInfo, [`ic_photo_${side}`]: base64 });
      setError('');
    } catch {
      setError('Failed to upload image');
    }
  };

  const validateStep1 = () => {
    const required = ['full_name', 'ic_number', 'phone', 'emergency_contact', 'social_media', 'address'];
    for (const f of required) {
      if (!customerInfo[f]?.trim()) {
        setError('Please fill in all required fields');
        return false;
      }
    }
    if (!customerInfo.ic_photo_front || !customerInfo.ic_photo_back) {
      setError('Please upload both front and back of your IC');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!termsAccepted) {
        setError('You must accept the Terms & Conditions to continue');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (deliveryMethod === 'cod' && !deliveryAddress.trim()) {
        setError('Please enter your delivery address for COD');
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        camera_id: cameraId,
        start_date: pendingBooking.startDate,
        end_date: pendingBooking.endDate,
        customer_info: customerInfo,
        delivery_method: deliveryMethod,
        pickup_location: deliveryMethod === 'self_pickup' ? pickupLocation : null,
        delivery_address: deliveryMethod === 'cod' ? deliveryAddress : null,
        terms_accepted: termsAccepted,
      };
      const { data } = await axios.post(`${API_URL}/api/bookings`, payload, {
        withCredentials: true,
      });
      sessionStorage.removeItem('pendingBooking');
      navigate(`/payment/${data.id}`);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !camera || !pendingBooking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  const days = differenceInDays(parseISO(pendingBooking.endDate), parseISO(pendingBooking.startDate)) + 1;
  const rentalTotal = days * camera.daily_rate;
  const deliveryFee = deliveryMethod === 'cod' ? 15 : 0;
  const totalAmount = rentalTotal + deliveryFee;
  const deposit = rentalTotal * 0.5;

  return (
    <div className="min-h-screen bg-[#FAF7F2]" data-testid="booking-page">
      <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto py-8 md:py-12">
        <Link
          to={`/camera/${cameraId}`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-[#6B0F1A] mb-6 font-medium"
        >
          <ChevronLeft size={20} />
          Back to Camera
        </Link>

        <div className="flex items-center justify-between mb-8 bg-white border border-neutral-200 p-4 md:p-6 overflow-x-auto">
          <Step number={1} label="Verification" active={currentStep === 1} completed={currentStep > 1} />
          <div className="h-px bg-neutral-200 flex-1 mx-3 hidden sm:block"></div>
          <Step number={2} label="Terms" active={currentStep === 2} completed={currentStep > 2} />
          <div className="h-px bg-neutral-200 flex-1 mx-3 hidden sm:block"></div>
          <Step number={3} label="Delivery" active={currentStep === 3} completed={currentStep > 3} />
          <div className="h-px bg-neutral-200 flex-1 mx-3 hidden sm:block"></div>
          <Step number={4} label="Payment" active={false} completed={false} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-neutral-200 p-6 md:p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm flex items-start gap-2" data-testid="booking-error">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {currentStep === 1 && (
                <div data-testid="step-1-verification">
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Identity Verification</h2>
                  <p className="text-neutral-600 mb-8">
                    Please provide accurate information for security and verification purposes.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-semibold text-neutral-900 mb-2 block">Full Name *</label>
                      <input
                        type="text"
                        value={customerInfo.full_name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, full_name: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A]"
                        data-testid="input-full-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-900 mb-2 block">IC Number *</label>
                      <input
                        type="text"
                        value={customerInfo.ic_number}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, ic_number: e.target.value })}
                        placeholder="XXXXXX-XX-XXXX"
                        className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A]"
                        data-testid="input-ic-number"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-900 mb-2 block">Phone Number *</label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        placeholder="+60 12-345 6789"
                        className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A]"
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-900 mb-2 block">Emergency Contact *</label>
                      <input
                        type="tel"
                        value={customerInfo.emergency_contact}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, emergency_contact: e.target.value })}
                        placeholder="Family/Guardian number"
                        className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A]"
                        data-testid="input-emergency-contact"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-900 mb-2 block">Social Media Username *</label>
                      <input
                        type="text"
                        value={customerInfo.social_media}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, social_media: e.target.value })}
                        placeholder="@instagram_username"
                        className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A]"
                        data-testid="input-social-media"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-semibold text-neutral-900 mb-2 block">Address *</label>
                      <textarea
                        rows={3}
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A]"
                        data-testid="input-address"
                      />
                    </div>

                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                      <div>
                        <label className="text-sm font-semibold text-neutral-900 mb-2 block">IC Photo (Front) *</label>
                        <label className="border-2 border-dashed border-neutral-300 hover:border-[#6B0F1A] p-4 flex flex-col items-center justify-center cursor-pointer min-h-[140px] transition-colors">
                          {customerInfo.ic_photo_front ? (
                            <img src={customerInfo.ic_photo_front} alt="IC Front" className="max-h-[120px] object-contain" />
                          ) : (
                            <>
                              <Upload size={24} className="text-neutral-400 mb-2" />
                              <span className="text-sm text-neutral-600">Click to upload front</span>
                              <span className="text-xs text-neutral-400 mt-1">Max 5MB</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleICUpload(e, 'front')}
                            data-testid="input-ic-front"
                          />
                        </label>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-neutral-900 mb-2 block">IC Photo (Back) *</label>
                        <label className="border-2 border-dashed border-neutral-300 hover:border-[#6B0F1A] p-4 flex flex-col items-center justify-center cursor-pointer min-h-[140px] transition-colors">
                          {customerInfo.ic_photo_back ? (
                            <img src={customerInfo.ic_photo_back} alt="IC Back" className="max-h-[120px] object-contain" />
                          ) : (
                            <>
                              <Upload size={24} className="text-neutral-400 mb-2" />
                              <span className="text-sm text-neutral-600">Click to upload back</span>
                              <span className="text-xs text-neutral-400 mt-1">Max 5MB</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleICUpload(e, 'back')}
                            data-testid="input-ic-back"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div data-testid="step-2-terms">
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Terms & Conditions</h2>
                  <p className="text-neutral-600 mb-6">
                    Please read carefully before proceeding. Once payment is made, you agree to all terms below.
                  </p>

                  <div className="bg-neutral-50 border border-neutral-200 p-6 max-h-96 overflow-y-auto text-sm text-neutral-700 space-y-4">
                    <div>
                      <h3 className="font-bold text-neutral-900 mb-2">Reservation & Deposit</h3>
                      <p>A booking payment of 50% of the rental fee is required to lock in the rental date. Reservations will only be confirmed after payment is received.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 mb-2">Late Return Charges</h3>
                      <p>A late return fee of RM5 per hour will be charged for equipment returned beyond the agreed rental period.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 mb-2">Equipment Care & Damage</h3>
                      <p>Customers are fully responsible for the rented equipment throughout the rental period. Any damage, loss, malfunction, or negligence resulting in repair costs will be charged accordingly. Minor damage may result in deductions from the security deposit. Additional penalties may be imposed for significant damage, with liability up to RM1,800 depending on the severity.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 mb-2">Identity Verification</h3>
                      <p>For security purposes, customers are required to provide: Valid IC, Active social media account, Emergency contact number. Failure to provide sufficient verification may result in booking rejection.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 mb-2">Collection & Return</h3>
                      <p>Self-pickup and COD services are available. A rental agreement must be signed during equipment collection. The equipment must be returned in the same condition as received.</p>
                    </div>
                  </div>

                  <div className="mt-6 bg-[#FAF7F2] border border-[#6B0F1A]/20 p-4">
                    <p className="text-sm text-neutral-700 italic">
                      "I confirm that all information provided is accurate and complete. I have read, understood, and agreed to all Terms & Conditions stated by kamera.kch. I understand that failure to comply with the rental agreement may result in penalties, deposit deductions, or compensation charges where applicable."
                    </p>
                  </div>

                  <label className="flex items-start gap-3 mt-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-5 h-5 accent-[#6B0F1A]"
                      data-testid="checkbox-terms"
                    />
                    <span className="text-sm font-semibold text-neutral-900">
                      I have read and agree to the Terms & Conditions
                    </span>
                  </label>
                </div>
              )}

              {currentStep === 3 && (
                <div data-testid="step-3-delivery">
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Delivery Method</h2>
                  <p className="text-neutral-600 mb-6">
                    Choose how you want to collect and return the camera.
                  </p>

                  <div className="space-y-4">
                    <label
                      className={`flex flex-col p-5 border-2 cursor-pointer transition-all ${
                        deliveryMethod === 'self_pickup'
                          ? 'border-[#6B0F1A] bg-[#FAF7F2]'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                      data-testid="option-self-pickup"
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="radio"
                          value="self_pickup"
                          checked={deliveryMethod === 'self_pickup'}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          className="mt-1 w-5 h-5 accent-[#6B0F1A]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-neutral-900">Self Pickup</h3>
                            <span className="text-[#6B0F1A] font-bold">FREE</span>
                          </div>
                          <p className="text-sm text-neutral-600 mt-1">Collect and return the camera yourself at our locations.</p>
                        </div>
                      </div>
                      {deliveryMethod === 'self_pickup' && (
                        <div className="mt-4 pl-9">
                          <label className="text-sm font-semibold text-neutral-900 mb-2 block">Select Pickup Location</label>
                          <select
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A] bg-white"
                            data-testid="select-pickup-location"
                          >
                            {PICKUP_LOCATIONS.map((loc) => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </label>

                    <label
                      className={`flex flex-col p-5 border-2 cursor-pointer transition-all ${
                        deliveryMethod === 'cod'
                          ? 'border-[#6B0F1A] bg-[#FAF7F2]'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                      data-testid="option-cod"
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="radio"
                          value="cod"
                          checked={deliveryMethod === 'cod'}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          className="mt-1 w-5 h-5 accent-[#6B0F1A]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-neutral-900">COD (Delivery & Collection)</h3>
                            <span className="text-[#6B0F1A] font-bold">+RM15</span>
                          </div>
                          <p className="text-sm text-neutral-600 mt-1">We deliver to your address and collect after rental period.</p>
                        </div>
                      </div>
                      {deliveryMethod === 'cod' && (
                        <div className="mt-4 pl-9">
                          <label className="text-sm font-semibold text-neutral-900 mb-2 block">Delivery Address</label>
                          <textarea
                            rows={3}
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Full delivery address..."
                            className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A] bg-white"
                            data-testid="input-delivery-address"
                          />
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                {currentStep > 1 && (
                  <button
                    onClick={() => { setCurrentStep(currentStep - 1); setError(''); }}
                    className="border border-neutral-300 text-neutral-700 font-semibold px-6 py-3 hover:bg-neutral-50"
                    data-testid="back-button"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={submitting}
                  className="flex-1 bg-[#6B0F1A] text-white font-semibold px-6 py-3 hover:bg-[#4A0A12] disabled:opacity-50"
                  data-testid="next-button"
                >
                  {(() => {
                    if (submitting) return 'Creating booking...';
                    if (currentStep === 3) return 'Continue to Payment';
                    return 'Continue';
                  })()}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200 p-6 lg:sticky lg:top-32">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Booking Summary</h3>
              <div className="flex gap-4 mb-4 pb-4 border-b border-neutral-200">
                <div className="w-20 h-20 bg-neutral-50 flex-shrink-0 overflow-hidden">
                  <img src={camera.image_url} alt={camera.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#6B0F1A] uppercase tracking-widest">{camera.brand}</div>
                  <div className="font-bold text-neutral-900">{camera.name}</div>
                  <div className="text-sm text-neutral-600">RM{camera.daily_rate}/day</div>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4 pb-4 border-b border-neutral-200">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Pickup:</span>
                  <span className="font-semibold">{format(parseISO(pendingBooking.startDate), 'MMM dd')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Return:</span>
                  <span className="font-semibold">{format(parseISO(pendingBooking.endDate), 'MMM dd')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Duration:</span>
                  <span className="font-semibold">{days} day{days !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Rental ({days}d)</span>
                  <span className="font-semibold">RM{rentalTotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">COD Fee</span>
                    <span className="font-semibold">RM{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="bg-[#FAF7F2] p-4 space-y-2">
                <div className="flex justify-between text-base font-bold">
                  <span>Total:</span>
                  <span>RM{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-300">
                  <span className="text-[#6B0F1A] font-semibold text-sm">Deposit Due:</span>
                  <span className="text-[#6B0F1A] font-bold">RM{deposit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Balance on pickup:</span>
                  <span>RM{(totalAmount - deposit).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
