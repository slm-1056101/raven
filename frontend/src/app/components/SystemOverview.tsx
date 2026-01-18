import { Building2, Clock, DollarSign, Users, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useApp } from '@/app/context/AppContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export function SystemOverview() {
  const { getCompanyProperties, getCompanyApplications, getCompanyUsers } = useApp();
  const properties = getCompanyProperties();
  const applications = getCompanyApplications();
  const users = getCompanyUsers();

  const availableProperties = properties.filter(p => p.status === 'Available').length;
  const activeApplications = applications.filter(a => a.status === 'Pending').length;
  const approvedApplications = applications.filter(a => a.status === 'Approved').length;
  
  const totalRevenue = applications
    .filter(a => a.status === 'Approved')
    .reduce((sum, app) => sum + app.offerAmount, 0);

  // Application trends data (monthly)
  const applicationTrends = [
    { month: 'Aug', applications: 12 },
    { month: 'Sep', applications: 18 },
    { month: 'Oct', applications: 15 },
    { month: 'Nov', applications: 22 },
    { month: 'Dec', applications: 28 },
    { month: 'Jan', applications: applications.length },
  ];

  // Property status distribution
  const propertyStatusData = [
    { status: 'Available', count: properties.filter(p => p.status === 'Available').length },
    { status: 'Reserved', count: properties.filter(p => p.status === 'Reserved').length },
    { status: 'Sold', count: properties.filter(p => p.status === 'Sold').length },
  ];

  // Revenue by property type
  const revenueByType = [
    {
      type: 'Residential',
      revenue: applications
        .filter(a => a.status === 'Approved')
        .filter(a => {
          const property = properties.find(p => p.id === a.propertyId);
          return property?.type === 'Residential';
        })
        .reduce((sum, a) => sum + a.offerAmount, 0) / 1000
    },
    {
      type: 'Commercial',
      revenue: applications
        .filter(a => a.status === 'Approved')
        .filter(a => {
          const property = properties.find(p => p.id === a.propertyId);
          return property?.type === 'Commercial';
        })
        .reduce((sum, a) => sum + a.offerAmount, 0) / 1000
    },
    {
      type: 'Agricultural',
      revenue: applications
        .filter(a => a.status === 'Approved')
        .filter(a => {
          const property = properties.find(p => p.id === a.propertyId);
          return property?.type === 'Agricultural';
        })
        .reduce((sum, a) => sum + a.offerAmount, 0) / 1000
    },
  ];

  const getPropertyTitle = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.title || 'Unknown Property';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold">System Overview</h2>
        <p className="text-gray-600 mt-2">Monitor key metrics and system performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Lands</p>
                <p className="text-3xl font-bold mt-2">{properties.length}</p>
                <p className="text-sm text-green-600 mt-1">{availableProperties} available</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Applications</p>
                <p className="text-3xl font-bold mt-2">{activeApplications}</p>
                <p className="text-sm text-gray-600 mt-1">Pending review</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-3xl font-bold mt-2">${(totalRevenue / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-green-600 mt-1">+{approvedApplications} approved</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold mt-2">{users.length}</p>
                <p className="text-sm text-gray-600 mt-1">Registered clients</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Application Trends</CardTitle>
            <CardDescription>Monthly application submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={applicationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Property Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Property Status</CardTitle>
            <CardDescription>Distribution by availability</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {propertyStatusData.map((entry, index) => (
                    <Bar
                      key={`cell-${index}`}
                      fill={
                        entry.status === 'Available' ? '#2563eb' :
                        entry.status === 'Reserved' ? '#10b981' :
                        '#f97316'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Property Type */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Property Type</CardTitle>
          <CardDescription>Total revenue from approved applications (in thousands)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}K`} />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest application submissions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentApplications.map((application) => (
              <div key={application.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  application.status === 'Approved' ? 'bg-green-100' :
                  application.status === 'Pending' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  {getStatusIcon(application.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    Application {application.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    {application.applicantName} applied for {getPropertyTitle(application.propertyId)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(application.dateApplied), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(application.offerAmount / 1000).toFixed(0)}K</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}