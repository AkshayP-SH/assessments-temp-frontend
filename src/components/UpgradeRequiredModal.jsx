import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

const UpgradeRequiredModal = ({ isOpen, onClose, quotaInfo }) => {
  const navigate = useNavigate();

  if (!isOpen || !quotaInfo) return null;

  const { resource, limit, used, tier } = quotaInfo;

<<<<<<< HEAD
  // Format resource name nicely
  const resourceName = resource === 'institutes' ? 'Institutes' :
    resource === 'tests' ? 'Tests' :
      resource === 'students' ? 'Students' :
        resource;
=======
  const resourceName = resource === 'institutes' ? 'Institutes' :
                       resource === 'tests' ? 'Tests' :
                       resource === 'students' ? 'Students' :
                       resource;
>>>>>>> 4e96627e172f5f7636bb58820818f25fc0432ca4

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-shnoor-navy/60 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-[0_20px_60px_rgba(14,14,39,0.15)] border-t-4 border-t-shnoor-danger animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-shnoor-dangerLight text-shnoor-danger rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-shnoor-navy">Upgrade Required</h3>
                <p className="text-sm font-medium text-shnoor-danger">Plan limit reached</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-shnoor-soft hover:bg-shnoor-lavender hover:text-shnoor-navy rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="bg-shnoor-lavender rounded-xl p-5 mb-6 border border-shnoor-light">
            <p className="text-shnoor-navy font-medium mb-3">
              You have reached the maximum limit of <strong className="text-shnoor-indigo">{limit} {resourceName}</strong> on your current <strong className="text-shnoor-indigo capitalize">{tier}</strong> plan.
            </p>
            <div className="flex justify-between items-center text-sm font-bold mt-4 pt-4 border-t border-shnoor-light">
              <span className="text-shnoor-indigoMedium">Current Usage:</span>
              <span className="text-shnoor-navy bg-white px-3 py-1 rounded-md border border-shnoor-light shadow-sm">{used} / {limit}</span>
            </div>
          </div>

          <p className="text-sm text-shnoor-soft mb-6 text-center">
            Upgrade your subscription plan to unlock higher limits and continue growing your organization.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white border-2 border-shnoor-light text-shnoor-navy hover:bg-shnoor-lavender hover:border-shnoor-mist rounded-xl font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/client/settings?tab=subscription');
              }}
              className="flex-1 py-3 px-4 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span>View Plans</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeRequiredModal;
