import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, BookOpen, CreditCard, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import SystemSettingsTab from '../../components/admin/SystemSettingsTab';
import QuestionBankTab from '../../components/admin/QuestionBankTab';
import MySubscriptionTab from './MySubscriptionTab';

const AdminSettings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSuperAdmin = localStorage.getItem('adminToken') !== null && localStorage.getItem('clientToken') === null;
    
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('tab') || 'system';
    });

    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) {
            setActiveTab(tab);
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
        }] : [])
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SystemSettingsTab;

    return (
        <AdminLayout title="Settings">
            {/* Tab Navigation */}
            <div className="bg-white shadow-sm rounded-2xl mb-6 overflow-hidden">
                <div className="border-b border-gray-100">
                    <nav className="flex overflow-x-auto hide-scrollbar space-x-4 sm:space-x-8 px-4 sm:px-8 pt-4 sm:pt-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="self-start -mt-2.5 flex items-center gap-2 h-10 px-4 shrink-0 border border-[#D1D1E6] bg-transparent text-[#9A9AC9] rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 pb-3 sm:pb-4 px-1 border-b-2 font-bold text-sm transition-colors whitespace-nowrap shrink-0 ${activeTab === tab.id
                                            ? 'border-[#403f75] text-[#403f75]'
                                            : 'border-transparent text-[#9A9AC9] hover:text-gray-900 hover:border-gray-200'
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
        </AdminLayout>
    );
};

export default AdminSettings;