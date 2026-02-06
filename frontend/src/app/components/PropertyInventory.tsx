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

const PAYMENT_METHOD_OPTIONS_RENTALS = ['Cash', 'CreditCard', 'Wave'] as const;

const PAYMENT_METHOD_OPTIONS_LAND = ['Cash', 'CreditCard', 'Wave', 'Installation', 'Mortgage'] as const;

type ExtraFields = {
  startDate?: string;
  endDate?: string;
  pickupTime?: string;
  year?: string;
  dimension?: string;
};

function readExtraFromFeatures(features: unknown): ExtraFields {
  if (!Array.isArray(features)) return {};
  const out: ExtraFields = {};
  for (const item of features) {
    if (typeof item !== 'string') continue;
    const idx = item.indexOf(':');
    if (idx <= 0) continue;
    const key = item.slice(0, idx).trim().toLowerCase();
    const value = item.slice(idx + 1).trim();
    if (!value) continue;
    if (key === 'start date') out.startDate = value;
    if (key === 'end date') out.endDate = value;
    if (key === 'pickup time') out.pickupTime = value;
    if (key === 'year') out.year = value;
    if (key === 'dimension') out.dimension = value;
  }
  return out;
}

function mergeExtraIntoFeatures(features: unknown, extra: ExtraFields): string[] {
  const base = Array.isArray(features) ? features.filter((x) => typeof x === 'string') : [];
  const shouldDrop = (key: string) => (line: string) => line.trim().toLowerCase().startsWith(`${key.toLowerCase()}:`);
  let next = base
    .filter((line) => !shouldDrop('Start Date')(line))
    .filter((line) => !shouldDrop('End Date')(line))
    .filter((line) => !shouldDrop('Pickup Time')(line))
    .filter((line) => !shouldDrop('Year')(line))
    .filter((line) => !shouldDrop('Dimension')(line));

  if (extra.startDate) next = [...next, `Start Date: ${extra.startDate}`];
  if (extra.endDate) next = [...next, `End Date: ${extra.endDate}`];
  if (extra.pickupTime) next = [...next, `Pickup Time: ${extra.pickupTime}`];
  if (extra.year) next = [...next, `Year: ${extra.year}`];
  if (extra.dimension) next = [...next, `Dimension: ${extra.dimension}`];
  return next;
}

export function PropertyInventory() {
  const { getCompanyProperties, createProperty, updateProperty, deleteProperty, currentCompany, authToken } = useApp();
  const properties = getCompanyProperties();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [extraFields, setExtraFields] = useState<ExtraFields>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
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
    setExtraFields(readExtraFromFeatures((property as any)?.features));
    setImageFiles([]);
    setLayoutImageFile(null);
    setShowEditDialog(true);
  };

  const handleAddNew = () => {
    setEditingProperty(null);
    setImageFiles([]);
    setLayoutImageFile(null);
    setExtraFields({});
    setFormData({
      title: '',
      description: '',
      location: '',
      plotNumber: '',
      roomNumber: '',
      price: 0,
      size: 0,
      status: 'Available',
      type: 'Land For Sale',
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

          const normalizedFeatures = mergeExtraIntoFeatures((formData as any).features, extraFields);
          const normalizedStatus = formData.status;

          if (formData.title != null) fd.append('title', String(formData.title));
          if (formData.description != null) fd.append('description', String(formData.description));
          if (formData.location != null) fd.append('location', String(formData.location));
          if (formData.plotNumber != null) fd.append('plotNumber', String(formData.plotNumber));
          if (formData.roomNumber != null) fd.append('roomNumber', String(formData.roomNumber));
          if (formData.price != null) fd.append('price', String(formData.price));
          if (formData.size != null) fd.append('size', String(formData.size));
          if (normalizedStatus != null) fd.append('status', String(normalizedStatus));
          if (formData.type != null) fd.append('type', String(formData.type));

          fd.append('features', JSON.stringify(normalizedFeatures));

          if (formData.financingMethods != null) {
            fd.append('financingMethods', JSON.stringify(formData.financingMethods));
          }

          for (const f of imageFiles) {
            fd.append('images', f);
          }
          if (layoutImageFile) fd.append('layoutImage', layoutImageFile);
          return fd;
        };

        if (editingProperty) {
          const payload = imageFiles.length > 0 || layoutImageFile
            ? (buildFormData() as any)
            : {
                ...formData,
                features: mergeExtraIntoFeatures((formData as any).features, extraFields),
              };
          await updateProperty(authToken, editingProperty.id, payload);
          notifySuccess('Property updated successfully');
        } else {
          const payload = imageFiles.length > 0 || layoutImageFile
            ? (buildFormData({ companyId: currentCompany.id }) as any)
            : {
                ...formData,
                features: mergeExtraIntoFeatures((formData as any).features, extraFields),
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
          {(() => {
            const type = formData.type as Property['type'] | undefined;
            const isRentalType =
              type === 'Property Rentals' || type === 'Commercial Rentals' || type === 'Car Rentals';
            const isLandType = type === 'Land For Sale' || type === 'Agricultural';

            const paymentOptions = isLandType ? PAYMENT_METHOD_OPTIONS_LAND : PAYMENT_METHOD_OPTIONS_RENTALS;

            const statusOptions: Array<{ label: string; value: Property['status'] }> = (() => {
              if (isRentalType) {
                return [
                  { label: 'Available', value: 'Available' },
                  { label: 'Booked', value: 'Reserved' },
                ];
              }
              if (type === 'Other') {
                return [
                  { label: 'Available', value: 'Available' },
                  { label: 'Sold', value: 'Sold' },
                ];
              }
              return [
                { label: 'Available', value: 'Available' },
                { label: 'Reserved', value: 'Reserved' },
                { label: 'Sold', value: 'Sold' },
              ];
            })();

            const showSize = type !== 'Car Rentals' && type !== 'Other';
            const showPlotNumber = type === 'Land For Sale' || type === 'Agricultural';
            const showRoomNumber = type === 'Commercial Rentals';
            const showDimension = type === 'Land For Sale' || type === 'Agricultural';
            const showStartEnd = isRentalType;
            const showPickupTime = type === 'Car Rentals';
            const showYear = type === 'Car Rentals';
            const showLayoutImage = type === 'Commercial Rentals' || type === 'Land For Sale' || type === 'Agricultural';

            const titleLabel = type === 'Car Rentals' ? 'Model' : 'Title';
            const plotLabel = type === 'Agricultural' ? 'Plot Number' : 'Plot Number';
            const roomLabel = type === 'Commercial Rentals' ? 'Suite' : 'Room Number';

            return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  const nextType = value as Property['type'];
                  setFormData({
                    ...formData,
                    type: nextType,
                    status:
                      nextType === 'Property Rentals' ||
                      nextType === 'Commercial Rentals' ||
                      nextType === 'Car Rentals'
                        ? 'Available'
                        : formData.status,
                  });
                  setExtraFields((prev) => ({ ...prev }));
                }}
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

            <div className="space-y-2">
              <Label htmlFor="title">{titleLabel}</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={type === 'Car Rentals' ? 'Car model' : 'Inventory title'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State"
              />
            </div>

            {(showPlotNumber || showRoomNumber || showDimension || showYear) && (
              <div className="grid grid-cols-2 gap-4">
                {showPlotNumber && (
                  <div className="space-y-2">
                    <Label htmlFor="plotNumber">{plotLabel}</Label>
                    <Input
                      id="plotNumber"
                      value={formData.plotNumber || ''}
                      onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                      placeholder="Plot number"
                    />
                  </div>
                )}

                {showRoomNumber && (
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">{roomLabel}</Label>
                    <Input
                      id="roomNumber"
                      value={formData.roomNumber || ''}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      placeholder="Suite"
                    />
                  </div>
                )}

                {showDimension && (
                  <div className="space-y-2">
                    <Label htmlFor="dimension">Dimension</Label>
                    <Input
                      id="dimension"
                      value={extraFields.dimension ?? ''}
                      onChange={(e) => setExtraFields({ ...extraFields, dimension: e.target.value })}
                      placeholder="e.g. 50x30"
                    />
                  </div>
                )}

                {showYear && (
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      value={extraFields.year ?? ''}
                      onChange={(e) => setExtraFields({ ...extraFields, year: e.target.value })}
                      placeholder="e.g. 2020"
                    />
                  </div>
                )}
              </div>
            )}

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
                    {statusOptions.map((o) => (
                      <SelectItem key={o.label} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showSize && (
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
              )}
            </div>

            {showStartEnd && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={extraFields.startDate ?? ''}
                    onChange={(e) => setExtraFields({ ...extraFields, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={extraFields.endDate ?? ''}
                    onChange={(e) => setExtraFields({ ...extraFields, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            {showPickupTime && (
              <div className="space-y-2">
                <Label htmlFor="pickupTime">Pickup Time</Label>
                <Input
                  id="pickupTime"
                  value={extraFields.pickupTime ?? ''}
                  onChange={(e) => setExtraFields({ ...extraFields, pickupTime: e.target.value })}
                  placeholder="e.g. 10:00 AM"
                />
              </div>
            )}

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
              <Label>Payment Method</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border p-3">
                {paymentOptions.map((m) => (
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
              <p className="text-xs text-gray-600">Select the payment methods you accept.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Upload Images</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
              />
            </div>

            {showLayoutImage && (
              <div className="space-y-2">
                <Label htmlFor="layoutImage">Upload Layout Image</Label>
                <Input
                  id="layoutImage"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setLayoutImageFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}
          </div>
            );
          })()}
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