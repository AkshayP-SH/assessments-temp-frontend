import React from 'react';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ children, title = "Dashboard" }) => {
  return (
    <div className="min-h-screen bg-theme-page font-sans text-theme-text transition-colors">
      <AdminHeader title={title} />

      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;