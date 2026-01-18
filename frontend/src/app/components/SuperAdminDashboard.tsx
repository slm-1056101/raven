import { useMemo, useState } from 'react';
import { Building2, CheckCircle, Shield, Users, Building, Power, ArrowLeft } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';

function statusBadgeVariant(status: string) {
  if (status === 'Active') return 'bg-green-600 text-white';
  if (status === 'Pending') return 'bg-yellow-500 text-white';
  if (status === 'Inactive') return 'bg-gray-500 text-white';
  return 'bg-gray-500 text-white';
}

export function SuperAdminDashboard() {
  const {
    companies,
    users,
    setCurrentView,
    setCurrentCompany,
    setCurrentUser,
    updateCompany,
    updateUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users'>('overview');

  const metrics = useMemo(() => {
    const activeCompanies = companies.filter((c) => c.status === 'Active').length;
    const pendingCompanies = companies.filter((c) => c.status === 'Pending').length;
    const inactiveCompanies = companies.filter((c) => c.status === 'Inactive').length;

    const superAdmins = users.filter((u) => u.role === 'SuperAdmin').length;
    const admins = users.filter((u) => u.role === 'Admin').length;
    const clients = users.filter((u) => u.role === 'Client').length;

    const activeUsers = users.filter((u) => u.status === 'Active').length;
    const inactiveUsers = users.filter((u) => u.status === 'Inactive').length;

    return {
      activeCompanies,
      pendingCompanies,
      inactiveCompanies,
      superAdmins,
      admins,
      clients,
      activeUsers,
      inactiveUsers,
    };
  }, [companies, users]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentCompany(null);
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">Raven</h1>
                  <span className="text-sm text-gray-600">Super Admin Portal</span>
                </div>
                <p className="text-sm text-gray-600 truncate">System-wide access to companies, users, and approvals</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setCurrentView('company-selection')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <Building2 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="companies" className="gap-2">
                <Building className="h-4 w-4" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Companies</CardTitle>
                  <CardDescription>All tenants in Raven</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold">{companies.length}</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusBadgeVariant('Active')}>Active: {metrics.activeCompanies}</Badge>
                    <Badge className={statusBadgeVariant('Pending')}>Pending: {metrics.pendingCompanies}</Badge>
                    <Badge className={statusBadgeVariant('Inactive')}>Inactive: {metrics.inactiveCompanies}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Users</CardTitle>
                  <CardDescription>All accounts across tenants</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold">{users.length}</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-600 text-white">Active: {metrics.activeUsers}</Badge>
                    <Badge className="bg-gray-600 text-white">Inactive: {metrics.inactiveUsers}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Roles</CardTitle>
                  <CardDescription>Role distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-indigo-600 text-white">Super Admin: {metrics.superAdmins}</Badge>
                    <Badge className="bg-purple-600 text-white">Admin: {metrics.admins}</Badge>
                    <Badge className="bg-emerald-600 text-white">Client: {metrics.clients}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Pending approvals</CardTitle>
                  <CardDescription>Companies awaiting activation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold">{metrics.pendingCompanies}</div>
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    disabled={metrics.pendingCompanies === 0}
                    onClick={() => setActiveTab('companies')}
                  >
                    Review pending companies
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="companies" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Company management</CardTitle>
                <CardDescription>Approve pending companies, disable access, and inspect tenant metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{company.logo}</div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{company.name}</div>
                              <div className="text-xs text-gray-600 truncate">{company.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadgeVariant(company.status)}>{company.status}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">{company.registeredDate}</TableCell>
                        <TableCell className="text-gray-700">
                          <div className="space-y-1">
                            <div className="text-sm">{company.contactEmail}</div>
                            <div className="text-xs text-gray-600">{company.contactPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {company.status === 'Pending' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 gap-2"
                                onClick={() => updateCompany(company.id, { status: 'Active' })}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </Button>
                            )}

                            {company.status !== 'Inactive' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => updateCompany(company.id, { status: 'Inactive' })}
                              >
                                <Power className="h-4 w-4" />
                                Deactivate
                              </Button>
                            )}

                            {company.status === 'Inactive' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => updateCompany(company.id, { status: 'Active' })}
                              >
                                <Power className="h-4 w-4" />
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User management</CardTitle>
                <CardDescription>Activate/deactivate users and review role access</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const companyName = user.companyId
                        ? companies.find((c) => c.id === user.companyId)?.name ?? user.companyId
                        : 'System';

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-gray-600">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-600 text-white">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.status === 'Active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">{companyName}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {user.status === 'Active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  disabled={user.role === 'SuperAdmin'}
                                  onClick={() => updateUser(user.id, { status: 'Inactive' })}
                                >
                                  <Power className="h-4 w-4" />
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 gap-2"
                                  onClick={() => updateUser(user.id, { status: 'Active' })}
                                >
                                  <Power className="h-4 w-4" />
                                  Activate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
