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
    } catch (err) {
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
    } catch (err) {
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

  if (loading) return <div className="p-8">Loading plans...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-shnoor-navy mb-6">Subscription Plans</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white border border-shnoor-mist rounded-xl p-6 shadow-sm">
            <div className="mb-4">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-1">Plan ID</label>
              <input 
                type="text" 
                value={plan.plan_id} 
                disabled 
                className="w-full bg-shnoor-lavender border border-shnoor-mist rounded p-2 text-sm text-shnoor-soft cursor-not-allowed"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-1">Name</label>
              <input 
                type="text" 
                value={plan.name} 
                onChange={(e) => handleChange(plan.id, 'name', e.target.value)}
                className="w-full border border-shnoor-mist rounded p-2 text-sm text-shnoor-navy focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-1">Price (Monthly INR)</label>
              <input 
                type="number" 
                value={plan.price_monthly} 
                onChange={(e) => handleChange(plan.id, 'price_monthly', e.target.value)}
                className="w-full border border-shnoor-mist rounded p-2 text-sm text-shnoor-navy focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-1">Description</label>
              <input 
                type="text" 
                value={plan.description || ''} 
                onChange={(e) => handleChange(plan.id, 'description', e.target.value)}
                className="w-full border border-shnoor-mist rounded p-2 text-sm text-shnoor-navy focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-shnoor-soft uppercase mb-1">Features (One per line)</label>
              <textarea 
                rows="5"
                value={(plan.features || []).join('\n')} 
                onChange={(e) => handleFeaturesChange(plan.id, e.target.value)}
                className="w-full border border-shnoor-mist rounded p-2 text-sm text-shnoor-navy focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none resize-none"
              />
            </div>

            <div className="mb-6 flex items-center">
              <input 
                type="checkbox" 
                id={`active-${plan.id}`}
                checked={plan.is_active}
                onChange={(e) => handleChange(plan.id, 'is_active', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor={`active-${plan.id}`} className="text-sm font-medium text-shnoor-navy">Is Active</label>
            </div>

            <button
              onClick={() => handleUpdate(plan)}
              disabled={saving === plan.id}
              className="w-full bg-shnoor-indigo text-white font-semibold py-2 rounded-lg hover:bg-shnoor-navy transition-colors disabled:opacity-50"
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
