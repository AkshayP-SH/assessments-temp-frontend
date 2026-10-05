import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';
import { Save, User, Lock, Eye, EyeOff } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';

const ProfileTab = () => {
    const [profileData, setProfileData] = useState({
        email: '',
        full_name: '',
        phone: '',
        address: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const getStoredAdminUser = () => {
        try {
            const raw = localStorage.getItem('adminUser');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const storedUser = getStoredAdminUser();
            const isClientAdmin = storedUser?.role === 'client_admin';
            const token = localStorage.getItem('adminToken');
            const profileEndpoint = isClientAdmin ? 'api/client/auth/me' : 'api/admin/me';

            const response = await apiFetch(profileEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success && data.admin) {
                setProfileData({
                    email: data.admin.email || '',
                    full_name: data.admin.full_name || data.admin.fullName || '',
                    phone: data.admin.phone || '',
                    address: data.admin.address || ''
                });
            } else if (isClientAdmin && storedUser) {
                setProfileData({
                    email: storedUser.email || '',
                    full_name: storedUser.fullName || storedUser.full_name || '',
                    phone: '',
                    address: ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            alert('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleUpdateProfile = async () => {
        if (!profileData.full_name || !profileData.email || !profileData.phone || !profileData.address) {
            alert('Please fill in all required fields.');
            return;
        }

        setIsSaving(true);
        try {
            const storedUser = getStoredAdminUser();
            if (storedUser?.role === 'client_admin') {
                alert('Profile updates for client admins are managed by your organization contact.');
                return;
            }

            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/admin/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: profileData.email,
                    full_name: profileData.full_name,
                    phone: profileData.phone,
                    address: profileData.address
                })
            });
            const data = await response.json();
            if (data.success) {
                alert('Profile updated successfully!');
            } else {
                alert(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            alert('New password must be at least 6 characters long');
            return;
        }

        setIsSaving(true);
        try {
            const storedUser = getStoredAdminUser();
            const isClientAdmin = storedUser?.role === 'client_admin';
            const token = localStorage.getItem('adminToken');
            const passwordEndpoint = isClientAdmin
                ? 'api/client/auth/change-password'
                : 'api/admin/change-password';
            const passwordBody = isClientAdmin
                ? {
                    email: profileData.email || storedUser?.email,
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }
                : {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                };

            const response = await apiFetch(passwordEndpoint, {
                method: isClientAdmin ? 'POST' : 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(passwordBody)
            });
            const data = await response.json();
            if (data.success) {
                alert('Password changed successfully!');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                alert(data.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Error changing password');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-shnoor-navy">Loading profile...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
                <p className="text-sm text-[#9A9AC9] mt-0.5">Manage your account details and security settings.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="p-6 bg-white rounded-2xl shadow-sm border-0">
                    <div className="flex items-center mb-4 space-x-2 text-[#403f75]">
                        <User size={24} />
                        <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
                    </div>
                    <p className="text-sm text-[#9A9AC9] mb-6">
                        Update your basic account information.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={profileData.full_name}
                                onChange={handleProfileChange}
                                className="w-full h-12 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={profileData.email}
                                onChange={handleProfileChange}
                                className="w-full h-12 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                                placeholder="Enter your email address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                className="w-full h-12 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={profileData.address}
                                onChange={handleProfileChange}
                                className="w-full h-12 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                                placeholder="Enter your address"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            onClick={handleUpdateProfile}
                            disabled={isSaving}
                            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-[#403f75] hover:bg-[#2d2d53] text-white h-12 px-6 rounded-xl font-bold shadow-sm transition-all"
                        >
                            <Save size={18} />
                            <span>{isSaving ? 'Updating...' : 'Update Profile'}</span>
                        </Button>
                    </div>
                </Card>

                <Card className="p-6 bg-white rounded-2xl shadow-sm border-0">
                    <div className="flex items-center mb-4 space-x-2 text-amber-500">
                        <Lock size={24} />
                        <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                    </div>
                    <p className="text-sm text-[#9A9AC9] mb-6">
                        Update your password to keep your account secure.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? "text" : "password"}
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full h-12 px-4 pr-12 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9A9AC9] hover:text-gray-900 transition-colors"
                                >
                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full h-12 px-4 pr-12 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9A9AC9] hover:text-gray-900 transition-colors"
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full h-12 px-4 pr-12 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9A9AC9] hover:text-gray-900 transition-colors"
                                >
                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            onClick={handleChangePassword}
                            disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-[#403f75] hover:bg-[#2d2d53] text-white h-12 px-6 rounded-xl font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Lock size={18} />
                            <span>{isSaving ? 'Updating...' : 'Update Password'}</span>
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProfileTab;