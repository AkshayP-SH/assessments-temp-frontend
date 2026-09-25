import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { getApiUrl } from '../../config/api';
import AdminHeader from '../../components/AdminHeader';
import Button from '../../components/Button';
import { ArrowLeft, CreditCard, Smartphone } from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';

const ClientPayment = () => {
  useSEO({
    title: 'Payment - SHNOOR Assessments',
    description: 'Complete your payment',
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { clientUser } = useClientAuth();
  
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const planId = location.state?.planId;

  if (!planId) {
    return (
      <div className="min-h-screen bg-shnoor-lavender flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">No plan selected.</p>
          <Button onClick={() => navigate('/client/subscription-plans')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const token = localStorage.getItem('clientToken') || localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const verifyResponse = await fetch(getApiUrl('api/settings/verify-payment'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: 'dummy_order_' + Date.now(),
          razorpay_payment_id: 'dummy_payment_' + Date.now(),
          razorpay_signature: 'dummy_signature',
          plan_id: planId,
          isDummyPayment: true,
          payment_method: paymentMethod
        }),
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        const storedUser = JSON.parse(localStorage.getItem('clientUser') || '{}');
        storedUser.requiresPayment = false;
        storedUser.clientStatus = 'active';
        storedUser.subscriptionActive = true;
        localStorage.setItem('clientUser', JSON.stringify(storedUser));
        localStorage.setItem('adminUser', JSON.stringify(storedUser));
        
        navigate('/client/dashboard', { 
          replace: true, 
          state: { message: 'Payment successful! Your subscription is now active.' } 
        });
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-shnoor-lavender via-white to-shnoor-lavender">
      <AdminHeader isClientPortal={true} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-shnoor-light hover:shadow-md w-fit mb-8"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Plan Details */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-shnoor-mist h-fit">
            <h2 className="text-2xl font-bold text-shnoor-navy mb-4">Subscription Plan</h2>
            {location.state?.plan ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-extrabold text-shnoor-indigo mb-2">
                    {location.state.plan.name}
                  </h3>
                  <p className="text-shnoor-soft">{location.state.plan.description}</p>
                </div>
                <div className="pb-6 border-b-2 border-shnoor-lavender">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-shnoor-navy">
                      ₹{location.state.plan.price_monthly}
                    </span>
                    <span className="text-lg text-shnoor-soft font-medium">/month</span>
                  </div>
                </div>
                {location.state.plan.features && Array.isArray(location.state.plan.features) && (
                  <div className="space-y-3">
                    {location.state.plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-shnoor-navy font-medium leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-shnoor-soft">Loading plan details...</p>
            )}
          </div>

          {/* Right Column: Payment Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-shnoor-mist h-fit">
            <h1 className="text-3xl font-extrabold text-shnoor-navy mb-6 text-center">Complete Payment</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-8">
              <div className="space-y-4">
                <label className="text-lg font-bold text-shnoor-navy block">Select Payment Method</label>
                
                <div className="grid grid-cols-1 gap-4">
                  <label 
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'upi' 
                        ? 'border-shnoor-indigo bg-indigo-50 shadow-md' 
                        : 'border-gray-200 hover:border-shnoor-indigo hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-shnoor-indigo border-gray-300 focus:ring-shnoor-indigo"
                    />
                    <Smartphone className={`w-6 h-6 ${paymentMethod === 'upi' ? 'text-shnoor-indigo' : 'text-gray-400'}`} />
                    <span className={`font-semibold text-lg ${paymentMethod === 'upi' ? 'text-shnoor-indigo' : 'text-gray-700'}`}>UPI</span>
                  </label>

                  <label 
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'card' 
                        ? 'border-shnoor-indigo bg-indigo-50 shadow-md' 
                        : 'border-gray-200 hover:border-shnoor-indigo hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-shnoor-indigo border-gray-300 focus:ring-shnoor-indigo"
                    />
                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-shnoor-indigo' : 'text-gray-400'}`} />
                    <span className={`font-semibold text-lg ${paymentMethod === 'card' ? 'text-shnoor-indigo' : 'text-gray-700'}`}>Credit / Debit Card</span>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={processing}
                className={`w-full h-14 flex items-center justify-center gap-2 text-lg font-bold shadow-lg transition-all duration-300 ${
                  processing ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-xl hover:scale-105'
                }`}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPayment;
