import { AppProvider, useApp } from '@/app/context/AppContext';
import { LandingPage } from '@/app/components/LandingPage';
import { CompaniesLanding } from '@/app/components/CompaniesLanding';
import { CompanyLanding } from '@/app/components/CompanyLanding';
import { PublicLandAcquisitionForm } from '@/app/components/PublicLandAcquisitionForm';
import { Login } from '@/app/components/Login';
import { Signup } from '@/app/components/Signup';
import { CompanySelection } from '@/app/components/CompanySelection';
import { ClientPortal } from '@/app/components/ClientPortal';
import { AdminDashboard } from '@/app/components/AdminDashboard';
import { SuperAdminDashboard } from '@/app/components/SuperAdminDashboard';
import { Toaster } from '@/app/components/ui/sonner';

function AppContent() {
  const { currentView, currentUser } = useApp();

  if (!currentUser && (currentView === 'company-selection' || currentView === 'client' || currentView === 'admin' || currentView === 'super-admin')) {
    return <Login />;
  }

  return (
    <>
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'companies-landing' && <CompaniesLanding />}
      {currentView === 'company-landing' && <CompanyLanding />}
      {currentView === 'public-application' && <PublicLandAcquisitionForm />}
      {currentView === 'login' && <Login />}
      {currentView === 'signup' && <Signup />}
      {currentView === 'company-selection' && <CompanySelection />}
      {currentView === 'client' && <ClientPortal />}
      {currentView === 'admin' && <AdminDashboard />}
      {currentView === 'super-admin' && <SuperAdminDashboard />}
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