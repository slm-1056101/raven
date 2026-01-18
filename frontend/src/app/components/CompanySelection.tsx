import { Building2, CheckCircle, ArrowRight, MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/app/context/AppContext';
import { Company } from '@/data/mockData';
import { toast } from 'sonner';

export function CompanySelection() {
  const { companies, setCurrentCompany, setCurrentView, currentUser } = useApp();

  const scopedCompanies = companies.filter((c) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SuperAdmin') return true;
    return c.id === currentUser.companyId;
  });

  const activeCompanies = scopedCompanies.filter((c) => c.status === 'Active');
  const pendingCompanies = scopedCompanies.filter((c) => c.status === 'Pending');

  const handleSelectCompany = (company: Company) => {
    if (!currentUser) {
      toast.error('Please login to continue');
      setCurrentView('login');
      return;
    }

    setCurrentCompany(company);

    if (currentUser.role === 'SuperAdmin') {
      setCurrentView('super-admin');
      return;
    }

    if (currentUser.role === 'Admin') {
      setCurrentView('admin');
      return;
    }

    if (currentUser.role === 'Client') {
      setCurrentView('client');
      return;
    }

    toast.error('Unsupported user role');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Pending':
        return 'bg-yellow-500';
      case 'Inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Raven</h1>
                <p className="text-sm text-gray-600">Multi-Tenant Property Management Platform</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentView('landing')}
            >
              Back
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">
              Select Your Company
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose your real estate company to access your dedicated portal with customized property listings and applications.
            </p>
          </div>

          {/* Active Companies Grid */}
          {activeCompanies.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-center">Active Companies</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCompanies.map((company) => (
                  <Card key={company.id} className="hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{company.logo}</div>
                          <div>
                            <CardTitle className="text-xl">{company.name}</CardTitle>
                            <Badge className={`${getStatusColor(company.status)} text-white mt-1`}>
                              {company.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-3 line-clamp-2">
                        {company.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{company.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="line-clamp-1">{company.contactEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{company.contactPhone}</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                          onClick={() => handleSelectCompany(company)}
                        >
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pending Companies */}
          {pendingCompanies.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-center">Pending Approval</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingCompanies.map((company) => (
                  <Card key={company.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{company.logo}</div>
                        <div>
                          <CardTitle className="text-xl">{company.name}</CardTitle>
                          <Badge className={`${getStatusColor(company.status)} text-white mt-1`}>
                            {company.status}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="mt-3">
                        {company.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Registration pending system administrator approval
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Super Admin Access */}
          {currentUser?.role === 'SuperAdmin' && (
            <div className="pt-12 border-t">
              <Card className="max-w-md mx-auto bg-gradient-to-br from-gray-50 to-gray-100">
                <CardHeader>
                  <CardTitle className="text-center">System Administrator</CardTitle>
                  <CardDescription className="text-center">
                    Access all companies and system-wide settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-gray-800 hover:bg-gray-900 gap-2"
                    onClick={() => setCurrentView('super-admin')}
                  >
                    <Building2 className="h-4 w-4" />
                    Super Admin Portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Register New Company Dialog */}
      {null}
    </div>
  );
}
