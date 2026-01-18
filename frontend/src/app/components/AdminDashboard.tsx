import { useState } from 'react';
import { AdminLayout } from '@/app/components/AdminLayout';
import { SystemOverview } from '@/app/components/SystemOverview';
import { PropertyInventory } from '@/app/components/PropertyInventory';
import { ApplicationReview } from '@/app/components/ApplicationReview';
import { UserManagement } from '@/app/components/UserManagement';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'overview' && <SystemOverview />}
      {activeTab === 'inventory' && <PropertyInventory />}
      {activeTab === 'applications' && <ApplicationReview />}
      {activeTab === 'users' && <UserManagement />}
    </AdminLayout>
  );
}
