import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../../components/Button';
import { getApiUrl } from '../../config/api';

const DummyCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get plan details from router state
  const planDetails = location.state?.planDetails;
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [upiId, setUpiId] = useState('user@shnoor');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // If no plan details were passed, redirect back to plans
  if (!planDetails) {
    navigate('/client/subscription-plans');
    return null;
  }

  const handleDummyPayment = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const token = localStorage.getItem('clientToken') || localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Directly call verify payment with dummy data
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
          plan_id: planDetails.id,
          isDummyPayment: true,
        }),
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        const storedUser = JSON.parse(localStorage.getItem('clientUser') || '{}');
        storedUser.requiresPayment = false;
        storedUser.clientStatus = 'active';
        storedUser.subscriptionActive = true;
        localStorage.setItem('clientUser', JSON.stringify(storedUser));
        localStorage.setItem('adminUser', JSON.stringify(storedUser)); // Mirror for shared pages
        
        navigate('/client/dashboard', { 
          replace: true, 
          state: { message: 'Payment successful! Your subscription is now active.' } 
        });
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* LEFT SIDE: Order Summary */}
      <div className="w-full md:w-5/12 bg-shnoor-navy text-white p-6 lg:p-10 flex flex-col relative h-full">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-shnoor-indigo rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-shnoor-primary rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          <button 
            onClick={() => navigate(-1)}
            disabled={isProcessing}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm font-medium w-fit"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <p className="text-shnoor-primary font-semibold tracking-wider text-xs uppercase mb-1">Order Summary</p>
          <h1 className="text-3xl lg:text-4xl font-bold mb-6">Checkout</h1>
          
          <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10 mb-6 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-start mb-4 shrink-0">
              <div>
                <h2 className="text-xl font-bold">{planDetails.name} Plan</h2>
                <p className="text-white/70 text-xs mt-1">Billed monthly • Cancel anytime</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold">₹{planDetails.price}</span>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-white/20 flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
              {planDetails.features?.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-shnoor-primary shrink-0 mt-0.5" />
                  <span className="text-white/80 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-lg font-bold pt-4 border-t border-white/20 shrink-0">
            <span>Total Due Today</span>
            <span>₹{planDetails.price}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 relative z-10 shrink-0">
          <p className="text-white/50 text-xs text-center flex items-center justify-center gap-1">
            <ShieldCheck size={14} /> Secured by SHNOOR Payments
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Payment Form */}
      <div className="w-full md:w-7/12 bg-gray-50 flex items-center justify-center p-6 lg:p-10 h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in my-auto shrink-0">
          
          <div className="p-6">
            <h3 className="text-lg font-bold text-shnoor-navy mb-4">Payment Method</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-start gap-2">
                <div className="shrink-0 mt-0.5">⚠️</div>
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-shnoor-indigo bg-blue-50/50 text-shnoor-indigo shadow-sm' 
                    : 'border-gray-100 hover:border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <CreditCard size={24} className="mb-2" />
                <span className="text-xs font-bold">Credit Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 transition-all ${
                  paymentMethod === 'upi' 
                    ? 'border-shnoor-indigo bg-blue-50/50 text-shnoor-indigo shadow-sm' 
                    : 'border-gray-100 hover:border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Smartphone size={24} className="mb-2" />
                <span className="text-xs font-bold">UPI</span>
              </button>
            </div>

            {/* Card Form */}
            {paymentMethod === 'card' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Card Number</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value="4242 4242 4242 4242" 
                      disabled 
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-mono tracking-wider cursor-not-allowed text-sm"
                    />
                    <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                    <input 
                      type="text" 
                      value="12/28" 
                      disabled 
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-mono tracking-wider cursor-not-allowed text-center text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">CVV</label>
                    <input 
                      type="password" 
                      value="123" 
                      disabled 
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-mono tracking-wider cursor-not-allowed text-center text-sm"
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name on Card</label>
                  <input 
                    type="text" 
                    value="John Doe" 
                    disabled 
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
              </div>
            )}

            {/* UPI Form */}
            {paymentMethod === 'upi' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">UPI ID / VPA</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-0 focus:border-shnoor-indigo transition-colors outline-none font-medium text-sm"
                      placeholder="example@okbank"
                    />
                    <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      A payment request will be sent to the UPI app linked to this ID. (Dummy mode: click Pay below to instantly simulate a successful payment).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <Button
              onClick={handleDummyPayment}
              disabled={isProcessing}
              className={`w-full h-12 flex items-center justify-center gap-2 text-base font-bold shadow-lg shadow-shnoor-indigo/20 transition-all duration-300 ${
                isProcessing ? 'opacity-75 cursor-wait' : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-shnoor-indigo/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                `Pay ₹${planDetails.price}`
              )}
            </Button>
          </div>

        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DummyCheckout;
