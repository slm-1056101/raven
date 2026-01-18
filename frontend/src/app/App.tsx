import { AppProvider, useApp } from '@/app/context/AppContext';
import { LandingPage } from '@/app/components/LandingPage';
import { CompanySelection } from '@/app/components/CompanySelection';
import { ClientPortal } from '@/app/components/ClientPortal';
import { AdminDashboard } from '@/app/components/AdminDashboard';
import { Toaster } from '@/app/components/ui/sonner';

function AppContent() {
  const { currentView } = useApp();

  return (
    <>
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'company-selection' && <CompanySelection />}
      {currentView === 'client' && <ClientPortal />}
      {currentView === 'admin' && <AdminDashboard />}
      {currentView === 'super-admin' && <div className="p-8 text-center">Super Admin Dashboard Coming Soon</div>}
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}