import { Building2, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useApp } from '@/app/context/AppContext';

export function LandingPage() {
  const { setCurrentView } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Delka System</h1>
              <p className="text-sm text-gray-600">Multi-Tenant Property Management Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-5xl font-bold text-gray-900">
            Welcome to Delka System
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive multi-tenant platform for managing vacant land acquisitions, applications, 
            and property inventory across multiple real estate companies.
          </p>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Client Portal Card */}
            <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
              <CardHeader className="space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Access Portal</CardTitle>
                <CardDescription className="text-base">
                  Browse properties and manage applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Property marketplace with advanced filters
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Multi-step application process
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Real-time application tracking
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setCurrentView('company-selection')}
                >
                  Select Your Company
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Admin Dashboard Card */}
            <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
              <CardHeader className="space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="h-10 w-10 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
                <CardDescription className="text-base">
                  Manage properties and review applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Company analytics and reporting
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Property inventory management
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Application review workflow
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700"
                  onClick={() => setCurrentView('company-selection')}
                >
                  Select Your Company
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold">Multi-Tenant</h3>
                <p className="text-sm text-gray-600">Support for multiple companies</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-bold">Smart Workflow</h3>
                <p className="text-sm text-gray-600">Streamlined application process</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold">Role Management</h3>
                <p className="text-sm text-gray-600">Clients, admins, and super admins</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}