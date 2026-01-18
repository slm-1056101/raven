import { Building2, CheckCircle, ArrowRight, MapPin, Phone, Mail, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/app/context/AppContext';
import { Company } from '@/data/mockData';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';

export function CompanySelection() {
  const { companies, setCurrentCompany, setCurrentView, setCurrentUser, users, addCompany } = useApp();
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  });

  const activeCompanies = companies.filter(c => c.status === 'Active');
  const pendingCompanies = companies.filter(c => c.status === 'Pending');

  const handleSelectCompany = (company: Company, role: 'client' | 'admin') => {
    setCurrentCompany(company);
    
    // Set a mock user based on role
    if (role === 'admin') {
      const adminUser = users.find(u => u.companyId === company.id && u.role === 'Admin');
      if (adminUser) {
        setCurrentUser(adminUser);
        setCurrentView('admin');
      }
    } else {
      const clientUser = users.find(u => u.companyId === company.id && u.role === 'Client');
      if (clientUser) {
        setCurrentUser(clientUser);
        setCurrentView('client');
      }
    }
  };

  const handleSuperAdminAccess = () => {
    const superAdmin = users.find(u => u.role === 'SuperAdmin');
    if (superAdmin) {
      setCurrentUser(superAdmin);
      setCurrentCompany(null);
      setCurrentView('super-admin');
    }
  };

  const handleRegisterCompany = () => {
    const newCompany: Company = {
      id: `company-${Date.now()}`,
      name: formData.name,
      logo: '🏢',
      description: formData.description,
      primaryColor: '#2563EB',
      status: 'Pending',
      registeredDate: new Date().toISOString().split('T')[0],
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      address: formData.address,
      adminUserId: `user-${Date.now()}`
    };

    addCompany(newCompany);
    toast.success('Company registration submitted! Pending approval.');
    setShowNewCompanyDialog(false);
    setFormData({
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    });
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

          {/* Register New Company */}
          <div className="flex justify-center">
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
              onClick={() => setShowNewCompanyDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Register New Company
            </Button>
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
                          onClick={() => handleSelectCompany(company, 'client')}
                        >
                          Enter as Client
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                          onClick={() => handleSelectCompany(company, 'admin')}
                        >
                          Enter as Admin
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
                  onClick={handleSuperAdminAccess}
                >
                  <Building2 className="h-4 w-4" />
                  Super Admin Portal
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Register New Company Dialog */}
      <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register New Company</DialogTitle>
            <DialogDescription>
              Submit your company information for approval. You'll receive an email once approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your Real Estate Company"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your company's focus and expertise..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, City, State ZIP"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCompanyDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleRegisterCompany}
              disabled={!formData.name || !formData.contactEmail}
            >
              Submit Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
