import { useMemo, useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { useApp } from '@/app/context/AppContext';
import { format } from 'date-fns';

import type { Application } from '@/app/types';

export function MyApplications() {
  const { applications: allApplications, properties: allProperties, currentUser } = useApp();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const applications = allApplications.filter((a) => {
    if (!currentUser) return false;
    if (a.userId && a.userId === currentUser.id) return true;
    if (a.applicantEmail && a.applicantEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    return false;
  });
  const properties = allProperties;

  const selectedProperty = useMemo(() => {
    if (!selectedApplication) return null;
    return properties.find((p) => p.id === selectedApplication.propertyId) ?? null;
  }, [properties, selectedApplication]);

  const getPropertyTitle = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.title || 'Unknown Property';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500 text-white';
      case 'Approved':
        return 'bg-green-500 text-white';
      case 'Rejected':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    approved: applications.filter(a => a.status === 'Approved').length,
  };

  const downloadText = (filename: string, contents: string) => {
    const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleView = (application: Application) => {
    setSelectedApplication(application);
    setShowDialog(true);
  };

  const handleDownloadContract = (application: Application) => {
    downloadText(
      `contract-${application.id}.txt`,
      JSON.stringify(
        {
          applicationId: application.id,
          propertyId: application.propertyId,
          status: application.status,
          offerAmount: application.offerAmount,
          applicantName: application.applicantName,
          applicantEmail: application.applicantEmail,
          dateApplied: application.dateApplied,
        },
        null,
        2,
      ),
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold">My Applications</h2>
        <p className="text-gray-600 mt-2">Track the status of your property applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <FileText className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">All time</p>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium">Total Applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-gray-600">Awaiting decision</p>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium">Pending Review</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-gray-600">Successful applications</p>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium">Approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Application History</CardTitle>
          <CardDescription>View and manage your property applications</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No applications yet. Browse the marketplace to get started!
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-mono text-sm">{application.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getPropertyTitle(application.propertyId)}</p>
                        <p className="text-sm text-gray-500">{application.applicantEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      D{application.offerAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(application.dateApplied), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(application.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(application.status)}
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant="outline">ID</Badge>
                        <Badge variant="outline">Funds</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(application)}>
                          View
                        </Button>
                        {application.status === 'Approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleDownloadContract(application)}
                          >
                            <Download className="h-3 w-3" />
                            Contract
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>View your submitted application information</DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Application ID</p>
                  <p className="font-mono text-sm">{selectedApplication.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={`${getStatusColor(selectedApplication.status)} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(selectedApplication.status)}
                    {selectedApplication.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Applied</p>
                  <p className="font-medium">{format(new Date(selectedApplication.dateApplied), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Offer Amount</p>
                  <p className="font-medium">D{selectedApplication.offerAmount.toLocaleString()}</p>
                </div>
              </div>

              {(selectedApplication.documents?.startDate || selectedApplication.documents?.endDate) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Rental Period</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-medium">
                        {selectedApplication.documents?.startDate
                          ? format(new Date(selectedApplication.documents.startDate), 'MMM dd, yyyy')
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-medium">
                        {selectedApplication.documents?.endDate
                          ? format(new Date(selectedApplication.documents.endDate), 'MMM dd, yyyy')
                          : '—'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Property</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedProperty ? (
                    <div>
                      <p className="font-medium">{selectedProperty.title}</p>
                      <p className="text-sm text-gray-600">{selectedProperty.location}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Unknown Property</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Applicant</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedApplication.applicantName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedApplication.applicantEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedApplication.applicantPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{selectedApplication.applicantAddress}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Offer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Financing Method</p>
                    <p className="font-medium">
                      {selectedApplication.financingMethod && selectedApplication.financingMethod !== 'undefined'
                        ? selectedApplication.financingMethod
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Intended Use</p>
                    <p className="font-medium">{selectedApplication.intendedUse}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}