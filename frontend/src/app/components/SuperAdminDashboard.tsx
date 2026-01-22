import { useMemo, useState } from 'react';
import { Building2, CheckCircle, Shield, Users, Building, Power, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { notifyError, notifySuccess } from '@/app/notify';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Textarea } from '@/app/components/ui/textarea';

function statusBadgeVariant(status: string) {
  if (status === 'Active') return 'bg-green-600 text-white';
  if (status === 'Pending') return 'bg-amber-500 text-white';
  if (status === 'Inactive') return 'bg-gray-500 text-white';
  return 'bg-gray-500 text-white';
}

export function SuperAdminDashboard() {
  const { companies, users, createCompany, updateCompany, deleteCompany, updateUser, authToken, setCurrentView, logout } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users'>('overview');
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    subscriptionPlan: 'Starter',
    maxPlots: 10,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  const [showEditCompanyDialog, setShowEditCompanyDialog] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editCompanyFormData, setEditCompanyFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    subscriptionPlan: 'Starter',
    maxPlots: 10,
  });

  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserFormData, setEditUserFormData] = useState({
    name: '',
    phone: '',
    role: 'Client',
    status: 'Active',
  });

  const handleRegisterCompany = () => {
    if (!authToken) {
      notifyError('Missing auth token');
      return;
    }

    (async () => {
      try {
        await createCompany(authToken, {
          name: companyFormData.name,
          description: companyFormData.description,
          logo: '🏢',
          primaryColor: '#2563EB',
          status: 'Pending',
          subscriptionPlan: companyFormData.subscriptionPlan,
          maxPlots: Number(companyFormData.maxPlots),
          contactEmail: companyFormData.contactEmail,
          contactPhone: companyFormData.contactPhone,
          address: companyFormData.address,
          adminName: companyFormData.adminName,
          adminEmail: companyFormData.adminEmail,
          adminPassword: companyFormData.adminPassword,
        } as any);
        notifySuccess('Company created');
        setShowNewCompanyDialog(false);
        setCompanyFormData({
          name: '',
          description: '',
          contactEmail: '',
          contactPhone: '',
          address: '',
          subscriptionPlan: 'Starter',
          maxPlots: 10,
          adminName: '',
          adminEmail: '',
          adminPassword: '',
        });
      } catch (err: any) {
        notifyError(err?.message || 'Failed to create company');
      }
    })();
  };

  const openEditCompany = (company: any) => {
    setEditingCompanyId(company.id);
    setEditCompanyFormData({
      name: company.name ?? '',
      description: company.description ?? '',
      contactEmail: company.contactEmail ?? '',
      contactPhone: company.contactPhone ?? '',
      address: company.address ?? '',
      subscriptionPlan: company.subscriptionPlan ?? 'Starter',
      maxPlots: company.maxPlots ?? 10,
    });
    setShowEditCompanyDialog(true);
  };

  const openEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditUserFormData({
      name: user.name ?? '',
      phone: user.phone ?? '',
      role: user.role ?? 'Client',
      status: user.status ?? 'Active',
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = () => {
    if (!editingUserId) return;
    if (!authToken) {
      notifyError('Missing auth token');
      return;
    }

    (async () => {
      try {
        await updateUser(authToken, editingUserId, {
          name: editUserFormData.name,
          phone: editUserFormData.phone,
          role: editUserFormData.role as any,
          status: editUserFormData.status as any,
        } as any);
        notifySuccess('User updated');
        setShowEditUserDialog(false);
        setEditingUserId(null);
      } catch (err: any) {
        notifyError(err?.message || 'Failed to update user');
      }
    })();
  };

  const handleUpdateCompany = () => {
    if (!editingCompanyId) return;
    if (!authToken) {
      notifyError('Missing auth token');
      return;
    }

    (async () => {
      try {
        await updateCompany(authToken, editingCompanyId, {
          name: editCompanyFormData.name,
          description: editCompanyFormData.description,
          contactEmail: editCompanyFormData.contactEmail,
          contactPhone: editCompanyFormData.contactPhone,
          address: editCompanyFormData.address,
          subscriptionPlan: editCompanyFormData.subscriptionPlan,
          maxPlots: Number(editCompanyFormData.maxPlots),
        });
        notifySuccess('Company updated');
        setShowEditCompanyDialog(false);
        setEditingCompanyId(null);
      } catch (err: any) {
        notifyError(err?.message || 'Failed to update company');
      }
    })();
  };

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
    logout();
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
                  <h1 className="text-2xl font-bold">Suwokono</h1>
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
                  <CardDescription>All tenants in Suwokono</CardDescription>
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle>Company management</CardTitle>
                    <CardDescription>Approve pending companies, disable access, and inspect tenant metadata</CardDescription>
                  </div>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setShowNewCompanyDialog(true)}
                  >
                    Register New Company
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Registered</TableHead>
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
                        <TableCell className="text-gray-700">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{company.subscriptionPlan ?? 'Starter'}</div>
                            <div className="text-xs text-gray-600">Max plots: {company.maxPlots ?? 10}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{company.contactEmail}</div>
                            <div className="text-xs text-gray-600">{company.contactPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">{company.registeredDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => openEditCompany(company)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>

                            {company.status === 'Pending' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 gap-2"
                                onClick={() => {
                                  if (!authToken) {
                                    notifyError('Missing auth token');
                                    return;
                                  }
                                  updateCompany(authToken, company.id, { status: 'Active' });
                                }}
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
                                onClick={() => {
                                  if (!authToken) {
                                    notifyError('Missing auth token');
                                    return;
                                  }
                                  updateCompany(authToken, company.id, { status: 'Inactive' });
                                }}
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
                                onClick={() => {
                                  if (!authToken) {
                                    notifyError('Missing auth token');
                                    return;
                                  }
                                  updateCompany(authToken, company.id, { status: 'Active' });
                                }}
                              >
                                <Power className="h-4 w-4" />
                                Reactivate
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-2">
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete company</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove the company from the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      if (!authToken) {
                                        notifyError('Missing auth token');
                                        return;
                                      }
                                      deleteCompany(authToken, company.id);
                                      notifySuccess('Company deleted');
                                    }}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Register New Company</DialogTitle>
                  <DialogDescription>
                    Submit company information. The company will start in Pending status and can be approved from this portal.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyFormData.name}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                      placeholder="Your Real Estate Company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={companyFormData.description}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, description: e.target.value })}
                      placeholder="Describe the company's focus and expertise..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={companyFormData.contactEmail}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, contactEmail: e.target.value })}
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone *</Label>
                      <Input
                        id="contactPhone"
                        value={companyFormData.contactPhone}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, contactPhone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address *</Label>
                    <Input
                      id="address"
                      value={companyFormData.address}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                      placeholder="123 Main Street, City, State ZIP"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionPlan">Subscription Plan *</Label>
                      <select
                        id="subscriptionPlan"
                        className="w-full h-10 border rounded px-3 text-sm"
                        value={companyFormData.subscriptionPlan}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, subscriptionPlan: e.target.value })}
                      >
                        <option value="Starter">Starter</option>
                        <option value="Growth">Growth</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPlots">Max Plots *</Label>
                      <Input
                        id="maxPlots"
                        type="number"
                        min={0}
                        value={companyFormData.maxPlots}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, maxPlots: Number(e.target.value) })}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Admin Account</p>
                      <p className="text-xs text-gray-600">Create the first Admin user for this company.</p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminName">Admin Name *</Label>
                        <Input
                          id="adminName"
                          value={companyFormData.adminName}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, adminName: e.target.value })}
                          placeholder="Company Admin"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Admin Email *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          value={companyFormData.adminEmail}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, adminEmail: e.target.value })}
                          placeholder="admin@company.com"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor="adminPassword">Admin Password *</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        value={companyFormData.adminPassword}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, adminPassword: e.target.value })}
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewCompanyDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleRegisterCompany}
                    disabled={!companyFormData.name || !companyFormData.contactEmail || !companyFormData.adminName || !companyFormData.adminEmail || !companyFormData.adminPassword}
                  >
                    Submit Registration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showEditCompanyDialog} onOpenChange={setShowEditCompanyDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Company</DialogTitle>
                  <DialogDescription>
                    Update company details.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editCompanyName">Company Name *</Label>
                    <Input
                      id="editCompanyName"
                      value={editCompanyFormData.name}
                      onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, name: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editDescription">Description *</Label>
                    <Textarea
                      id="editDescription"
                      value={editCompanyFormData.description}
                      onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, description: e.target.value })}
                      placeholder="Describe the company..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editContactEmail">Contact Email *</Label>
                      <Input
                        id="editContactEmail"
                        type="email"
                        value={editCompanyFormData.contactEmail}
                        onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, contactEmail: e.target.value })}
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editContactPhone">Contact Phone *</Label>
                      <Input
                        id="editContactPhone"
                        value={editCompanyFormData.contactPhone}
                        onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, contactPhone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editSubscriptionPlan">Subscription Plan *</Label>
                      <select
                        id="editSubscriptionPlan"
                        className="w-full h-10 border rounded px-3 text-sm"
                        value={editCompanyFormData.subscriptionPlan}
                        onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, subscriptionPlan: e.target.value })}
                      >
                        <option value="Starter">Starter</option>
                        <option value="Growth">Growth</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editMaxPlots">Max Plots *</Label>
                      <Input
                        id="editMaxPlots"
                        type="number"
                        min={0}
                        value={editCompanyFormData.maxPlots}
                        onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, maxPlots: Number(e.target.value) })}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editAddress">Business Address *</Label>
                    <Input
                      id="editAddress"
                      value={editCompanyFormData.address}
                      onChange={(e) => setEditCompanyFormData({ ...editCompanyFormData, address: e.target.value })}
                      placeholder="123 Main Street, City, State ZIP"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditCompanyDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleUpdateCompany}
                    disabled={!editCompanyFormData.name || !editCompanyFormData.contactEmail}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                disabled={user.role === 'SuperAdmin'}
                                onClick={() => openEditUser(user)}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                              {user.status === 'Active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  disabled={user.role === 'SuperAdmin'}
                                  onClick={() => {
                                    if (!authToken) {
                                      notifyError('Missing auth token');
                                      return;
                                    }
                                    updateUser(authToken, user.id, { status: 'Inactive' });
                                  }}
                                >
                                  <Power className="h-4 w-4" />
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 gap-2"
                                  onClick={() => {
                                    if (!authToken) {
                                      notifyError('Missing auth token');
                                      return;
                                    }
                                    updateUser(authToken, user.id, { status: 'Active' });
                                  }}
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

            <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>Update user details and access.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editUserName">Name *</Label>
                    <Input
                      id="editUserName"
                      value={editUserFormData.name}
                      onChange={(e) => setEditUserFormData({ ...editUserFormData, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editUserPhone">Phone</Label>
                    <Input
                      id="editUserPhone"
                      value={editUserFormData.phone}
                      onChange={(e) => setEditUserFormData({ ...editUserFormData, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editUserRole">Role</Label>
                      <select
                        id="editUserRole"
                        className="w-full h-10 border rounded px-3 text-sm"
                        value={editUserFormData.role}
                        onChange={(e) => setEditUserFormData({ ...editUserFormData, role: e.target.value })}
                        disabled={editUserFormData.role === 'SuperAdmin'}
                      >
                        <option value="Client">Client</option>
                        <option value="Admin">Admin</option>
                        <option value="SuperAdmin">SuperAdmin</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editUserStatus">Status</Label>
                      <select
                        id="editUserStatus"
                        className="w-full h-10 border rounded px-3 text-sm"
                        value={editUserFormData.status}
                        onChange={(e) => setEditUserFormData({ ...editUserFormData, status: e.target.value })}
                        disabled={editUserFormData.role === 'SuperAdmin'}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditUserDialog(false);
                      setEditingUserId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleUpdateUser}
                    disabled={!editUserFormData.name}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
