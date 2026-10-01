import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../config/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

const SubscriptionPlansSettings = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('api/subscription-plans/all', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
      } else {
        setError(data.message || 'Failed to fetch plans');
      }
    } catch {
      setError('Error fetching subscription plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
     
    fetchPlans();
  }, [fetchPlans]);

  const handleUpdate = async (plan) => {
    setSaving(plan.id);
    try {
      const res = await apiFetch(`api/subscription-plans/${plan.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(plan),
      });
      const data = await res.json();
      if (data.success) {
        alert('Plan updated successfully');
        fetchPlans();
      } else {
        alert(data.message || 'Failed to update plan');
      }
    } catch {
      alert('Error updating plan');
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (id, field, value) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleFeaturesChange = (id, featuresString) => {
    const featuresArray = featuresString.split('\n').map(f => f.trim()).filter(Boolean);
    handleChange(id, 'features', featuresArray);
  };

  if (loading) return <div className="py-8 text-shnoor-indigoMedium">Loading plans...</div>;
  if (error) return <div className="py-8 text-red-600">{error}</div>;

  return (
    <div className="pt-2 pb-8 max-w-[1200px]">
      <h2 className="text-2xl font-bold text-shnoor-navy mb-8">Subscription Plans</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white border-0 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="mb-5">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-2">Plan ID</label>
              <input 
                type="text" 
                value={plan.plan_id} 
                readOnly
                className="w-full bg-transparent border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-2">Name</label>
              <input 
                type="text" 
                value={plan.name} 
                onChange={(e) => handleChange(plan.id, 'name', e.target.value)}
                className="w-full bg-transparent border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy focus:border-shnoor-indigo outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-2">Pricing (INR)</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="block text-[10px] font-bold text-shnoor-soft mb-1.5 tracking-wide uppercase">30 Days</span>
                  <input 
                    type="number" 
                    value={plan.price_monthly || ''} 
                    readOnly
                    className="w-full bg-transparent border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-shnoor-soft mb-1.5 tracking-wide uppercase">90 Days</span>
                  <input 
                    type="number" 
                    value={plan.price_quarterly || ''} 
                    readOnly
                    className="w-full bg-transparent border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-shnoor-soft mb-1.5 tracking-wide uppercase">1 Year</span>
                  <input 
                    type="number" 
                    value={plan.price_yearly || ''} 
                    readOnly
                    className="w-full bg-transparent border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-2">Description</label>
              <input 
                type="text" 
                value={plan.description || ''} 
                onChange={(e) => handleChange(plan.id, 'description', e.target.value)}
                className="w-full bg-transparent border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy focus:border-shnoor-indigo outline-none"
              />
            </div>

            <div className="mb-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold text-shnoor-soft uppercase mb-2">Max Institutes</label>
                  <input 
                    type="number" 
                    value={plan.max_institutes || ''} 
                    onChange={(e) => handleChange(plan.id, 'max_institutes', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy focus:border-shnoor-indigo outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold text-shnoor-soft uppercase mb-2">Max Tests</label>
                  <input 
                    type="number" 
                    value={plan.max_tests || ''} 
                    onChange={(e) => handleChange(plan.id, 'max_tests', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy focus:border-shnoor-indigo outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold text-shnoor-soft uppercase mb-2">Max Students</label>
                  <input 
                    type="number" 
                    value={plan.max_students || ''} 
                    onChange={(e) => handleChange(plan.id, 'max_students', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy focus:border-shnoor-indigo outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mb-5 flex-1">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-2">Features (One per line)</label>
              <textarea 
                rows="6"
                value={(plan.features || []).join('\n')} 
                onChange={(e) => handleFeaturesChange(plan.id, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-shnoor-navy focus:border-shnoor-indigo outline-none resize-none"
              />
            </div>

            <div className="mb-6 flex items-center border-t border-gray-100 pt-4 mt-auto">
              <input 
                type="checkbox" 
                id={`active-${plan.id}`}
                checked={plan.is_active}
                onChange={(e) => handleChange(plan.id, 'is_active', e.target.checked)}
                className="mr-2 w-4 h-4 text-shnoor-indigo border-gray-300 rounded focus:ring-shnoor-indigo"
              />
              <label htmlFor={`active-${plan.id}`} className="text-sm font-medium text-shnoor-navy">Is Active Plan</label>
            </div>

            <button
              onClick={() => handleUpdate(plan)}
              disabled={saving === plan.id}
              className="w-full bg-shnoor-indigo text-white font-bold py-3 rounded-xl hover:bg-shnoor-navy transition-colors shadow-sm disabled:opacity-50"
            >
              {saving === plan.id ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlansSettings;
