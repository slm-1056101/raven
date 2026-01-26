import { useState } from 'react';
import { Plus, Search, MapPin, Square, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { LayoutDocumentPreviewDialog } from '@/app/components/LayoutDocumentPreviewDialog';
import { useApp } from '@/app/context/AppContext';
import { notifyError, notifySuccess } from '@/app/notify';

import type { Property } from '@/app/types';

const FINANCING_METHOD_OPTIONS = [
  'Cash Payment',
  'Mortgage/Loan',
  'Mixed (Cash + Loan)',
  'Installment Plan',
] as const;

export function PropertyInventory() {
  const { getCompanyProperties, createProperty, updateProperty, deleteProperty, currentCompany, authToken } = useApp();
  const properties = getCompanyProperties();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [layoutImageFile, setLayoutImageFile] = useState<File | null>(null);

  const [layoutPreviewOpen, setLayoutPreviewOpen] = useState(false);
  const [layoutPreviewUrl, setLayoutPreviewUrl] = useState<string | null>(null);
  const [layoutPreviewTitle, setLayoutPreviewTitle] = useState('Layout Document');

  const filteredProperties = properties.filter((property) =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: properties.length,
    available: properties.filter(p => p.status === 'Available').length,
    reserved: properties.filter(p => p.status === 'Reserved').length,
    sold: properties.filter(p => p.status === 'Sold').length,
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData(property);
    setImageFile(null);
    setLayoutImageFile(null);
    setShowEditDialog(true);
  };

  const handleAddNew = () => {
    setEditingProperty(null);
    setImageFile(null);
    setLayoutImageFile(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      plotNumber: '',
      roomNumber: '',
      price: 0,
      size: 0,
      status: 'Available',
      type: 'Residential',
      features: [],
      financingMethods: [],
    });
    setShowEditDialog(true);
  };

  const handleSave = () => {
    if (!authToken) {
      notifyError('Missing auth token');
      return;
    }
    if (!currentCompany) {
      notifyError('Please select a company');
      return;
    }

    (async () => {
      try {
        const buildFormData = (extra?: { companyId?: string }) => {
          const fd = new FormData();
          if (extra?.companyId) fd.append('companyId', extra.companyId);

          if (formData.title != null) fd.append('title', String(formData.title));
          if (formData.description != null) fd.append('description', String(formData.description));
          if (formData.location != null) fd.append('location', String(formData.location));
          if (formData.plotNumber != null) fd.append('plotNumber', String(formData.plotNumber));
          if (formData.roomNumber != null) fd.append('roomNumber', String(formData.roomNumber));
          if (formData.price != null) fd.append('price', String(formData.price));
          if (formData.size != null) fd.append('size', String(formData.size));
          if (formData.status != null) fd.append('status', String(formData.status));
          if (formData.type != null) fd.append('type', String(formData.type));

          if (formData.financingMethods != null) {
            fd.append('financingMethods', JSON.stringify(formData.financingMethods));
          }

          if (imageFile) fd.append('image', imageFile);
          if (layoutImageFile) fd.append('layoutImage', layoutImageFile);
          return fd;
        };

        if (editingProperty) {
          const payload = imageFile || layoutImageFile ? (buildFormData() as any) : formData;
          await updateProperty(authToken, editingProperty.id, payload);
          notifySuccess('Property updated successfully');
        } else {
          const payload = imageFile || layoutImageFile
            ? (buildFormData({ companyId: currentCompany.id }) as any)
            : {
                ...formData,
                companyId: currentCompany.id,
              };
          await createProperty(authToken, payload);
          notifySuccess('Property added successfully');
        }
        setShowEditDialog(false);
      } catch (err: any) {
        notifyError(err?.message || 'Failed to save property');
      }
    })();
  };

  const handleDelete = (id: string) => {
    if (!authToken) {
      notifyError('Missing auth token');
      return;
    }
    (async () => {
      try {
        await deleteProperty(authToken, id);
        notifySuccess('Property deleted successfully');
        setDeletingPropertyId(null);
      } catch (err: any) {
        notifyError(err?.message || 'Failed to delete property');
      }
    })();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500';
      case 'Reserved':
        return 'bg-yellow-500';
      case 'Sold':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Inventory</h2>
          <p className="text-gray-600 mt-2">Manage your property listings</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={handleAddNew}>
          <Plus className="h-4 w-4" />
          Add New Inventory
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search properties by title, location, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Mini-Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Properties</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{stats.available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Reserved</p>
            <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.reserved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Sold</p>
            <p className="text-2xl font-bold mt-1 text-gray-600">{stats.sold}</p>
          </CardContent>
        </Card>
      </div>

      {/* Property Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
          <CardDescription>View and manage all property listings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={property.imageUrl}
                        alt={property.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium">{property.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{property.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{property.location}</span>
                    </div>
                    {!!property.layoutImageUrl && (
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => {
                          setLayoutPreviewTitle('Layout Document');
                          setLayoutPreviewUrl(property.layoutImageUrl || null);
                          setLayoutPreviewOpen(true);
                        }}
                      >
                        View layout
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{property.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Square className="h-4 w-4 text-gray-400" />
                      <span>{property.size.toLocaleString()} m²</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">D{property.price.toLocaleString()}K</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(property.status)} text-white`}>
                      {property.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(property)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeletingPropertyId(property.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Edit Inventory' : 'Add New Inventory'}</DialogTitle>
            <DialogDescription>
              {editingProperty ? 'Update property information' : 'Add a new property to the inventory'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Property title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Property['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Property Rentals">Property Rentals</SelectItem>
                    <SelectItem value="Commercial Rentals">Commercial Rentals</SelectItem>
                    <SelectItem value="Agricultural">Agricultural</SelectItem>
                    <SelectItem value="Land For Sale">Land For Sale</SelectItem>
                    <SelectItem value="Car Rentals">Car Rentals</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plotNumber">Plot Number</Label>
                <Input
                  id="plotNumber"
                  value={formData.plotNumber || ''}
                  onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber || ''}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Property description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Property['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size (m²)</Label>
                <Input
                  id="size"
                  type="number"
                  value={formData.size || ''}
                  onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (in thousands)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Allowed Financing Methods</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border p-3">
                {FINANCING_METHOD_OPTIONS.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formData.financingMethods) ? formData.financingMethods.includes(m) : false}
                      onChange={() => {
                        const current = Array.isArray(formData.financingMethods) ? formData.financingMethods : [];
                        const next = current.includes(m) ? current.filter((x) => x !== m) : [...current, m];
                        setFormData({ ...formData, financingMethods: next });
                      }}
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-600">If none selected, clients can choose any method.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Upload Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="layoutImage">Upload Layout Image</Label>
              <Input
                id="layoutImage"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setLayoutImageFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPropertyId} onOpenChange={() => setDeletingPropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingPropertyId && handleDelete(deletingPropertyId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LayoutDocumentPreviewDialog
        open={layoutPreviewOpen}
        onOpenChange={setLayoutPreviewOpen}
        title={layoutPreviewTitle}
        url={layoutPreviewUrl}
      />
    </div>
  );
}