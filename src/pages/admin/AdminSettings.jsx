import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, BookOpen, CreditCard, ArrowLeft, Image } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import SystemSettingsTab from '../../components/admin/SystemSettingsTab';
import QuestionBankTab from '../../components/admin/QuestionBankTab';
import ClientBrandingTab from '../../components/admin/ClientBrandingTab';
import MySubscriptionTab from './MySubscriptionTab';

const AdminSettings = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSuperAdmin = localStorage.getItem('adminToken') !== null && localStorage.getItem('clientToken') === null;
    
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('subtab') || (params.get('tab') !== 'settings' ? params.get('tab') : null) || 'system';
    });

    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const subtab = params.get('subtab') || (params.get('tab') !== 'settings' ? params.get('tab') : null);
        if (subtab && ['system', 'questionbank', 'subscription', 'branding'].includes(subtab)) {
            setActiveTab(subtab);
        }
    }, [location.search]);

    const tabs = [
        {
            id: 'system',
            label: 'System Settings',
            icon: Settings,
            component: SystemSettingsTab
        },
        {
            id: 'questionbank',
            label: 'Question Bank',
            icon: BookOpen,
            component: QuestionBankTab
        },
        ...(!isSuperAdmin ? [{
            id: 'subscription',
            label: 'My Subscription',
            icon: CreditCard,
            component: MySubscriptionTab
        }, {
            id: 'branding',
            label: 'Organization Branding',
            icon: Image,
            component: ClientBrandingTab
        }] : [])
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SystemSettingsTab;

    const content = (
        <div className="w-full space-y-6">
            {/* Header Row */}
            <div className="section-header">
                <div className="section-header-left">
                    <h2 className="section-title">Settings</h2>
                    <p className="section-subtitle">
                        {isSuperAdmin
                            ? 'Configure global application behaviors, question bank, and system preferences'
                            : 'Manage your organization’s portal settings, logo, and subscription'}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1A1A32] shadow-sm rounded-2xl mb-6 overflow-hidden border border-slate-200/80 dark:border-slate-800">
                <div className="border-b border-gray-100 dark:border-slate-800">
                    <nav className="flex overflow-x-auto hide-scrollbar space-x-4 sm:space-x-8 px-4 sm:px-8 pt-4 sm:pt-6">
                        {!isEmbedded && (
                            <button
                                onClick={() => navigate(-1)}
                                className="self-start -mt-2.5 flex items-center gap-2 h-10 px-4 shrink-0 border border-[#D1D1E6] dark:border-slate-700 bg-transparent text-[#9A9AC9] dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-300 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        )}
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 pb-3 sm:pb-4 px-1 border-b-2 font-bold text-sm transition-colors whitespace-nowrap shrink-0 ${activeTab === tab.id
                                            ? 'border-[#403f75] text-[#403f75] dark:border-indigo-400 dark:text-indigo-400'
                                            : 'border-transparent text-[#9A9AC9] dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-200'
                                        }`}
                                >
                                    <Icon size={18} className="sm:size-5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-8">
                    <ActiveComponent />
                </div>
            </div>
        </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <AdminLayout title="Settings">
            {content}
        </AdminLayout>
    );
};

export default AdminSettings;