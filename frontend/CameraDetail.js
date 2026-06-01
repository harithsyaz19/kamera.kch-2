import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [payment, setPayment] = useState(null);
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    const checkPayment = async () => {
      if (!paymentId) {
        setStatus('failed');
        return;
      }

      try {
        const { data } = await axios.get(`${API_URL}/api/payments/${paymentId}`, {
          withCredentials: true,
        });
        setPayment(data);

        if (data.status === 'succeeded') {
          setStatus('success');
        } else if (data.status === 'failed') {
          setStatus('failed');
        } else {
          setTimeout(checkPayment, 3000);
        }
      } catch (e) {
        console.error('Error checking payment:', e);
        setStatus('failed');
      }
    };

    checkPayment();
  }, [paymentId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center" data-testid="payment-result-loading">
        <div className="text-center">
          <div className="text-white/70 mb-4">Checking payment status...</div>
          <div className="animate-pulse text-white">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center" data-testid="payment-result-page">
      <div className="max-w-md w-full mx-6">
        <div className="border border-white/10 bg-[#0A0A0A] p-8 text-center">
          {status === 'success' ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" data-testid="success-icon" />
              <h1 className="text-4xl font-black tracking-tighter text-white mb-4" data-testid="success-heading">
                Payment Successful!
              </h1>
              <p className="text-white/70 mb-8">
                Your booking has been confirmed. You will receive a confirmation shortly.
              </p>
              <div className="space-y-4">
                <Link to="/my-bookings" className="block">
                  <Button className="w-full bg-white text-black font-bold px-8 py-4 hover:bg-gray-200" data-testid="view-bookings-button">
                    View My Bookings
                  </Button>
                </Link>
                <Link to="/" className="block">
                  <Button className="w-full border border-white/20 text-white font-bold px-8 py-4 hover:bg-white/5" data-testid="back-home-button">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" data-testid="failure-icon" />
              <h1 className="text-4xl font-black tracking-tighter text-white mb-4" data-testid="failure-heading">
                Payment Failed
              </h1>
              <p className="text-white/70 mb-8">
                Your payment could not be processed. Please try again or contact support.
              </p>
              <div className="space-y-4">
                <Link to="/catalog" className="block">
                  <Button className="w-full bg-white text-black font-bold px-8 py-4 hover:bg-gray-200" data-testid="try-again-button">
                    Try Again
                  </Button>
                </Link>
                <Link to="/" className="block">
                  <Button className="w-full border border-white/20 text-white font-bold px-8 py-4 hover:bg-white/5">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
