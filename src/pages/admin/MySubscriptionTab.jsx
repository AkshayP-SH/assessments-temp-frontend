import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, AlertTriangle, CheckCircle, Calendar, Zap } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { apiFetch } from '../../config/api';

const MySubscriptionTab = ({ quota: propQuota, user: propUser }) => {
  const navigate = useNavigate();
  const isSuperAdmin = localStorage.getItem('adminToken') !== null && localStorage.getItem('clientToken') === null;
  const user = propUser || JSON.parse(localStorage.getItem('clientUser') || '{}');
  const [quota, setQuota] = React.useState(propQuota || null);

  const normalizeQuota = (rawQuota) => {
    if (!rawQuota) return null;

    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return {
      institutes: {
        used: toNumber(rawQuota.institutes?.used),
        max: toNumber(rawQuota.institutes?.max),
      },
      tests: {
        used: toNumber(rawQuota.tests?.used),
        max: toNumber(rawQuota.tests?.max),
      },
      students: {
        used: toNumber(rawQuota.students?.used),
        max: toNumber(rawQuota.students?.max),
      },
    };
  };

  React.useEffect(() => {
    if (propQuota) {
      setQuota(normalizeQuota(propQuota));
      return;
    }

    if (isSuperAdmin) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    apiFetch('api/client/auth/me/quota', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.success) {
          setQuota(normalizeQuota(d.quota));
        }
      })
      .catch(() => { });
  }, [propQuota, isSuperAdmin, user?.id, user?.subscriptionTier]);

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const diff = new Date(endDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysRemaining = getDaysRemaining(user?.subscriptionEndDate);
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  const renderProgressBar = (label, used, max) => {
    const safeUsed = Number.isFinite(Number(used)) ? Number(used) : 0;
    const safeMax = Number.isFinite(Number(max)) ? Number(max) : 0;
    const percentage = safeMax > 0
      ? Math.max(0, Math.min((safeUsed / safeMax) * 100, 100))
      : 0;
    const isNearingLimit = percentage > 85;

    return (
      <div className="mb-6 last:mb-0">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-shnoor-indigoMedium">{label}</span>
          <span className="font-semibold text-shnoor-indigo">
            {safeUsed} / {safeMax}
          </span>
        </div>
        <div className="w-full bg-shnoor-mist rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${isNearingLimit ? 'bg-red-500' : 'bg-shnoor-indigo'} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {isNearingLimit && (
          <p className="text-xs text-red-500 mt-1 flex items-center">
            <AlertTriangle size={12} className="mr-1" />
            Nearing limit
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light">
        <div>
          <h2 className="text-2xl font-bold text-shnoor-indigo">Subscription & Billing</h2>
          <p className="text-shnoor-indigoMedium mt-1">Manage your plan and usage limits</p>
        </div>
        <Button
          onClick={() => navigate('/client/subscription-plans')}
          className="flex items-center space-x-2 shadow-lg shadow-shnoor-primary/20 hover:-translate-y-1 transition-all"
        >
          <Zap size={18} />
          <span>Upgrade or Renew</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Plan Details Card */}
        <Card className="lg:col-span-1 shadow-sm border border-shnoor-light relative overflow-hidden">
          {/* Decorative background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-shnoor-primary/10 to-shnoor-accent/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

          <h3 className="text-lg font-bold text-shnoor-indigo mb-6 flex items-center">
            <CreditCard size={20} className="mr-2 text-shnoor-primary" />
            Current Plan
          </h3>

          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-sm text-shnoor-indigoMedium mb-1">Active Tier</p>
              <div className="flex items-center">
                <span className="text-2xl font-extrabold text-shnoor-indigo capitalize tracking-tight">
                  {(user?.planId || user?.subscriptionTier || 'Free').replace('_', ' ')}
                </span>
                {user?.subscriptionActive && !isExpired && (
                  <span className="ml-3 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center">
                    <CheckCircle size={12} className="mr-1" /> Active
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-shnoor-mist">
              <p className="text-sm text-shnoor-indigoMedium mb-2 flex items-center">
                <Calendar size={16} className="mr-2" />
                Subscription Expiry
              </p>
              {user?.subscriptionEndDate ? (
                <div>
                  <p className="font-semibold text-shnoor-indigo">
                    {new Date(user.subscriptionEndDate).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>

                  {isExpired ? (
                    <p className="text-red-500 text-sm font-bold mt-1 flex items-center">
                      <AlertTriangle size={14} className="mr-1" /> Expired
                    </p>
                  ) : daysRemaining !== null && daysRemaining <= 14 ? (
                    <p className="text-orange-500 text-sm font-medium mt-1">
                      Expires in {daysRemaining} days
                    </p>
                  ) : (
                    <p className="text-green-600 text-sm font-medium mt-1">
                      {daysRemaining} days remaining
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-shnoor-indigoMedium italic">No active subscription</p>
              )}
            </div>
          </div>
        </Card>

        {/* Quota Usage Card */}
        <Card className="lg:col-span-2 shadow-sm border border-shnoor-light">
          <h3 className="text-lg font-bold text-shnoor-indigo mb-6 flex items-center">
            <Zap size={20} className="mr-2 text-shnoor-primary" />
            Resource Usage
          </h3>

          {quota ? (
            <div className="space-y-4">
              {renderProgressBar('Active Institutes', quota.institutes.used, quota.institutes.max)}
              {renderProgressBar('Total Tests Created', quota.tests.used, quota.tests.max)}
              {renderProgressBar('Total Students', quota.students.used, quota.students.max)}

              <div className="mt-8 pt-6 border-t border-shnoor-mist">
                <p className="text-sm text-shnoor-indigoMedium bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start">
                  <AlertTriangle size={16} className="text-blue-500 mt-0.5 mr-2 shrink-0" />
                  <span>
                    Need more resources? Upgrade your plan to instantly increase your limits. Custom enterprise solutions are also available for higher volume requirements.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-2.5 bg-gray-200 rounded-full w-full"></div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default MySubscriptionTab;
