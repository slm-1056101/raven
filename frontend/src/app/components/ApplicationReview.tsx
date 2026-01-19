import { useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Eye, Download, User, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { useApp } from '@/app/context/AppContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

import type { Application } from '@/app/types';

export function ApplicationReview() {
  const { getCompanyApplications, getCompanyProperties, updateApplication, authToken } = useApp();
  const applications = getCompanyApplications();
  const properties = getCompanyProperties();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
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

  const handleDownloadDocument = (application: Application, kind: 'idDocument' | 'proofOfFunds') => {
    const raw = (application as any)?.documents?.[kind] as string | null | undefined;
    if (!raw) {
      toast.error('No document available');
      return;
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      window.open(raw, '_blank', 'noopener,noreferrer');
      return;
    }

    downloadText(
      `${kind}-${application.id}.txt`,
      JSON.stringify(
        {
          applicationId: application.id,
          documentType: kind,
          documentName: raw,
        },
        null,
        2,
      ),
    );
  };

  const getPropertyDetails = (propertyId: string) => {
    return properties.find(p => p.id === propertyId);
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

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    return app.status.toLowerCase() === activeTab;
  });

  const handleReview = (application: Application) => {
    setSelectedApplication(application);
    setShowReviewDialog(true);
  };

  const handleApprove = () => {
    if (selectedApplication) {
      if (!authToken) {
        toast.error('Missing auth token');
        return;
      }
      (async () => {
        try {
          await updateApplication(authToken, selectedApplication.id, { status: 'Approved' });
          toast.success('Application approved successfully');
          setShowReviewDialog(false);
          setSelectedApplication(null);
        } catch (err: any) {
          toast.error(err?.message || 'Failed to approve application');
        }
      })();
    }
  };

  const handleReject = () => {
    if (selectedApplication) {
      if (!authToken) {
        toast.error('Missing auth token');
        return;
      }
      (async () => {
        try {
          await updateApplication(authToken, selectedApplication.id, { status: 'Rejected' });
          toast.success('Application rejected');
          setShowReviewDialog(false);
          setSelectedApplication(null);
        } catch (err: any) {
          toast.error(err?.message || 'Failed to reject application');
        }
      })();
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold">Application Review</h2>
        <p className="text-gray-600 mt-2">Review and manage property applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <FileText className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-1">Total Applications</p>
              </div>
            </div>
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
                <p className="text-sm text-gray-600 mt-1">Pending Review</p>
              </div>
            </div>
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
                <p className="text-sm text-gray-600 mt-1">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-sm text-gray-600 mt-1">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Review and manage all applications</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((application) => {
                      const property = getPropertyDetails(application.propertyId);
                      return (
                        <TableRow key={application.id}>
                          <TableCell className="font-mono text-sm">{application.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{application.applicantName}</p>
                              <p className="text-sm text-gray-500">{application.applicantEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{property?.title || 'Unknown'}</p>
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleReview(application)}
                            >
                              <Eye className="h-4 w-4" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Detail Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Review</DialogTitle>
            <DialogDescription>Review detailed application information</DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={`${getStatusColor(selectedApplication.status)} flex items-center gap-1`}>
                  {getStatusIcon(selectedApplication.status)}
                  {selectedApplication.status}
                </Badge>
                <span className="text-sm text-gray-600">
                  {format(new Date(selectedApplication.dateApplied), 'MMMM dd, yyyy')}
                </span>
              </div>

              {/* Applicant Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <CardTitle>Applicant Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{selectedApplication.applicantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedApplication.applicantEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Application ID</p>
                      <p className="font-mono text-sm">{selectedApplication.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-mono text-sm">{selectedApplication.userId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <CardTitle>Property Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const property = getPropertyDetails(selectedApplication.propertyId);
                    return property ? (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <img
                            src={property.imageUrl}
                            alt={property.title}
                            className="w-32 h-32 rounded object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{property.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{property.description}</p>
                            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {property.location}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Listed Price</p>
                            <p className="font-medium">D{property.price}K</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Size</p>
                            <p className="font-medium">{property.size.toLocaleString()} m²</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Type</p>
                            <p className="font-medium">{property.type}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Property not found</p>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Offer Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <CardTitle>Offer Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Offer Amount</p>
                    <p className="text-3xl font-bold text-blue-600">
                      D{selectedApplication.offerAmount.toLocaleString()}
                    </p>
                    {(() => {
                      const property = getPropertyDetails(selectedApplication.propertyId);
                      if (property) {
                        const listedPrice = property.price * 1000;
                        const difference = selectedApplication.offerAmount - listedPrice;
                        return (
                          <p className="text-sm text-gray-600 mt-1">
                            {difference >= 0 ? '+' : ''}D{difference.toLocaleString()} from listed price
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Financing Method</p>
                      <p className="font-medium">{selectedApplication.financingMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Intended Use</p>
                      <p className="font-medium">{selectedApplication.intendedUse}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submitted Documents */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    <CardTitle>Submitted Documents</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">ID Document</p>
                      <p className="text-sm text-gray-600">{selectedApplication.documents.idDocument}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleDownloadDocument(selectedApplication, 'idDocument')}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Proof of Funds</p>
                      <p className="text-sm text-gray-600">{selectedApplication.documents.proofOfFunds}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleDownloadDocument(selectedApplication, 'proofOfFunds')}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {selectedApplication.status === 'Pending' && (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 gap-2"
                    onClick={handleApprove}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Application
                  </Button>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 gap-2"
                    onClick={handleReject}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}