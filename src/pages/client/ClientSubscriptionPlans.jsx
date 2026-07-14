import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { apiFetch, getApiUrl } from '../../config/api';
import AdminHeader from '../../components/AdminHeader';
import Button from '../../components/Button';
import { useSEO } from '../../hooks/useSEO';

// ============================================================================
// PAYMENT MODE CONFIGURATION
// ============================================================================
// Set to true for dummy/test payments (no actual payment gateway)
// Set to false for real Razorpay integration
const DUMMY_PAYMENT_MODE = true;
// ============================================================================

const ClientSubscriptionPlans = () => {
  useSEO({
    title: 'Subscription Plans - SHNOOR Assessments',
    description: 'Choose the perfect plan for your organization',
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { clientUser, logout } = useClientAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPlan, setProcessingPlan] = useState(null);
  
  const requiresPayment = location.state?.requiresPayment || false;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await apiFetch('api/subscription-plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      } else {
        setError('Failed to load subscription plans');
      }
    } catch (err) {
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    setProcessingPlan(planId);
    setError('');
    
    try {
      // Use the configured payment mode
      const isDummyMode = DUMMY_PAYMENT_MODE;
      
      if (isDummyMode) {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get the token from localStorage
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
            plan_id: planId,
            isDummyPayment: true,
          }),
        });

        const verifyData = await verifyResponse.json();
        
        if (verifyData.success) {
          // Update local storage to reflect active subscription
          const storedUser = JSON.parse(localStorage.getItem('clientUser') || '{}');
          storedUser.requiresPayment = false;
          storedUser.clientStatus = 'active';
          storedUser.subscriptionActive = true;
          localStorage.setItem('clientUser', JSON.stringify(storedUser));
          localStorage.setItem('adminUser', JSON.stringify(storedUser)); // Mirror for shared pages
          
          // Payment successful, navigate to dashboard
          navigate('/client/dashboard', { 
            replace: true, 
            state: { message: 'Payment successful! Your subscription is now active.' } 
          });
        } else {
          setError('Payment verification failed. Please contact support.');
        }
        setProcessingPlan(null);
        return;
      }
      
      // REAL RAZORPAY MODE (for future use)
      // Create Razorpay order
      const orderResponse = await apiFetch('api/settings/purchase-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Load Razorpay SDK
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'SHNOOR Assessments',
          description: 'Subscription Plan',
          order_id: orderData.order_id,
          handler: async (response) => {
            // Verify payment
            try {
              const verifyResponse = await apiFetch('api/settings/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_id: planId,
                }),
              });

              const verifyData = await verifyResponse.json();
              
              if (verifyData.success) {
                // Payment successful, navigate to dashboard
                navigate('/client/dashboard', { 
                  replace: true, 
                  state: { message: 'Payment successful! Your subscription is now active.' } 
                });
              } else {
                setError('Payment verification failed. Please contact support.');
              }
            } catch (err) {
              setError('Payment verification failed. Please contact support.');
            } finally {
              setProcessingPlan(null);
            }
          },
          prefill: {
            email: clientUser?.email || '',
            name: clientUser?.fullName || '',
          },
          theme: {
            color: '#6366f1',
          },
          modal: {
            ondismiss: () => {
              setProcessingPlan(null);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        setError('Failed to load payment gateway. Please try again.');
        setProcessingPlan(null);
      };
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      setProcessingPlan(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login?portal=org');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-shnoor-lavender">
        <AdminHeader isClientPortal={true} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-shnoor-indigo border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-shnoor-lavender via-white to-shnoor-lavender">
      <AdminHeader isClientPortal={true} onLogout={handleLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Test Mode Banner - Only show in dummy mode */}
        {DUMMY_PAYMENT_MODE && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-400 rounded-2xl p-5 shadow-lg animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-blue-900 mb-1">Test Mode Active</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  This is a dummy payment system for testing. No actual payment will be processed. Click any "Select Plan" button to simulate successful payment and activate your account instantly.
                </p>
              </div>
            </div>
          </div>
        )}

        {requiresPayment && (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-6 shadow-lg animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-yellow-900 mb-2">Payment Required</h3>
                <p className="text-base text-yellow-800 leading-relaxed">
                  Your account is currently in awaiting payment status. Please select a subscription plan and complete payment to activate your account and access all features.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-extrabold text-shnoor-navy mb-4 tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-xl text-shnoor-soft max-w-3xl mx-auto leading-relaxed">
            Select the perfect plan for your organization's assessment needs and start managing exams like a pro
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-5 shadow-lg animate-shake">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className="group relative bg-white rounded-3xl shadow-xl border-2 border-shnoor-mist hover:border-shnoor-indigo transition-all duration-300 overflow-hidden animate-slide-up hover:shadow-2xl hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-8 flex-1">
                <div className="mb-6">
                  <h3 className="text-3xl font-extrabold text-shnoor-navy mb-2 group-hover:text-shnoor-indigo transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-shnoor-soft leading-relaxed">{plan.description}</p>
                </div>
                
                <div className="mb-8 pb-6 border-b-2 border-shnoor-lavender">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-shnoor-navy group-hover:text-shnoor-indigo transition-colors">
                      ₹{plan.price_monthly}
                    </span>
                    <span className="text-lg text-shnoor-soft font-medium">/month</span>
                  </div>
                  <p className="text-xs text-shnoor-soft mt-2">Billed monthly • Cancel anytime</p>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features && Array.isArray(plan.features) 
                    ? plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3 group/item">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center group-hover/item:bg-green-200 transition-colors">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-shnoor-navy font-medium leading-relaxed">{feature}</span>
                      </div>
                    ))
                    : null
                  }
                </div>
              </div>

              <div className="p-8 pt-0">
                <Button
                  onClick={() => handleSelectPlan(plan.plan_id)}
                  disabled={processingPlan !== null}
                  className={`w-full h-14 flex items-center justify-center gap-2 text-base font-bold shadow-lg transition-all duration-300 ${
                    processingPlan === plan.plan_id
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {processingPlan === plan.plan_id ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {DUMMY_PAYMENT_MODE ? 'Select Plan (Test Mode)' : 'Select Plan'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!requiresPayment && (
          <div className="text-center mt-16 animate-fade-in">
            <button
              onClick={() => navigate('/client/dashboard')}
              className="text-shnoor-indigo hover:text-shnoor-navy font-semibold text-base underline underline-offset-4 transition-colors"
            >
              Skip for now and go to dashboard →
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ClientSubscriptionPlans;
