import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { apiFetch } from '../../config/api';
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
        
        // Directly call verify payment with dummy data
        const verifyResponse = await apiFetch('api/settings/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: 'dummy_order_' + Date.now(),
            razorpay_payment_id: 'dummy_payment_' + Date.now(),
            razorpay_signature: 'dummy_signature',
            plan_id: planId,
            isDummyPayment: true, // Flag to skip signature verification
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
    <div className="min-h-screen bg-shnoor-lavender">
      <AdminHeader isClientPortal={true} onLogout={handleLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Mode Banner - Only show in dummy mode */}
        {DUMMY_PAYMENT_MODE && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-blue-900 mb-1">Test Mode Active</h3>
                <p className="text-xs text-blue-800">
                  This is a dummy payment system for testing. No actual payment will be processed. Click any "Select Plan" button to simulate successful payment and activate your account instantly.
                </p>
              </div>
            </div>
          </div>
        )}

        {requiresPayment && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-yellow-900 mb-1">Payment Required</h3>
                <p className="text-sm text-yellow-800">
                  Your account is currently in awaiting payment status. Please select a subscription plan and complete payment to activate your account and access all features.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-shnoor-navy mb-3">Choose Your Plan</h1>
          <p className="text-lg text-shnoor-soft max-w-2xl mx-auto">
            Select the perfect plan for your organization's assessment needs
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl shadow-lg border-2 border-shnoor-mist hover:border-shnoor-indigo transition-all duration-200 overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1">
                <h3 className="text-2xl font-extrabold text-shnoor-navy mb-2">{plan.name}</h3>
                <p className="text-sm text-shnoor-soft mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-shnoor-navy">₹{plan.price_monthly}</span>
                    <span className="text-shnoor-soft">/month</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features && Array.isArray(plan.features) 
                    ? plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-shnoor-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-shnoor-navy">{feature}</span>
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
                  className="w-full h-12 flex items-center justify-center gap-2"
                >
                  {processingPlan === plan.plan_id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/client/dashboard')}
              className="text-shnoor-indigo hover:text-shnoor-navy font-semibold text-sm underline"
            >
              Skip for now and go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSubscriptionPlans;
