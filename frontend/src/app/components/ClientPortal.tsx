import { useState } from 'react';
import { Building2, FileText } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { PropertyMarketplace } from '@/app/components/PropertyMarketplace';
import { MyApplications } from '@/app/components/MyApplications';
import { useApp } from '@/app/context/AppContext';

export function ClientPortal() {
  const { logout, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('marketplace');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏢</div>
              <div>
                <h1 className="text-2xl font-bold">Suwokono</h1>
                <p className="text-sm text-gray-600">Client Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {currentUser && (
                <div className="text-sm text-right">
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-gray-600">{currentUser.email}</p>
                </div>
              )}
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-14 bg-transparent border-b-0">
              <TabsTrigger value="marketplace" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                <Building2 className="h-4 w-4" />
                Property Marketplace
              </TabsTrigger>
              <TabsTrigger value="applications" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                <FileText className="h-4 w-4" />
                My Applications
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'marketplace' && <PropertyMarketplace />}
        {activeTab === 'applications' && <MyApplications />}
      </div>
    </div>
  );
}