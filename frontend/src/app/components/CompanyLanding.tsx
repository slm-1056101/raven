import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, DollarSign, Home, MapPin, Square, Sprout } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { apiFetch } from '@/app/api';
import { LandAcquisitionForm } from '@/app/components/LandAcquisitionForm';
import { LayoutDocumentPreviewDialog } from '@/app/components/LayoutDocumentPreviewDialog';
import { useApp } from '@/app/context/AppContext';
import { notifyError } from '@/app/notify';

import type { Company, Property } from '@/app/types';

export function CompanyLanding() {
  const { publicCompanyId, setCurrentView, authToken, currentUser, setIntendedCompanyId, setIntendedCompanyName, setPublicProperty } = useApp();

  const [company, setCompany] = useState<Company | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [locationFilter, setLocationFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const [layoutPreviewOpen, setLayoutPreviewOpen] = useState(false);
  const [layoutPreviewUrl, setLayoutPreviewUrl] = useState<string | null>(null);
  const [layoutPreviewTitle, setLayoutPreviewTitle] = useState('Layout Document');

  useEffect(() => {
    if (!publicCompanyId) {
      setCompany(null);
      setProperties([]);
      return;
    }

    setIsLoading(true);
    (async () => {
      try {
        const [companiesResp, propertiesResp] = await Promise.all([
          apiFetch<Company[]>('/api/public/companies/'),
          apiFetch<Property[]>(`/api/public/properties/?companyId=${encodeURIComponent(publicCompanyId)}`),
        ]);

        const found = (companiesResp || []).find((c) => c.id === publicCompanyId) ?? null;
        setCompany(found);

        const normalized = (propertiesResp as any[]).map((p) => ({
          ...p,
          companyId: (p.companyId ?? p.company ?? null) as string,
          price: typeof p.price === 'string' ? Number(p.price) : p.price,
          size: typeof p.size === 'string' ? Number(p.size) : p.size,
        })) as Property[];

        setProperties(Array.isArray(normalized) ? normalized : []);
      } catch {
        setCompany(null);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [publicCompanyId, setCompany, setCurrentView]);

  const locationOptions = useMemo(() => {
    return Array.from(
      new Set(
        properties
          .map((p) => (p.location ?? '').trim())
          .filter((v) => v.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [properties]);

  const filteredProperties = properties.filter((property) => {
    if (locationFilter !== 'all') {
      if (property.location !== locationFilter) return false;
    }

    if (sizeFilter !== 'all') {
      if (sizeFilter === 'small' && property.size >= 2000) return false;
      if (sizeFilter === 'medium' && (property.size < 2000 || property.size > 5000)) return false;
      if (sizeFilter === 'large' && property.size <= 5000) return false;
    }

    if (priceFilter !== 'all') {
      if (priceFilter === 'under400' && property.price >= 400) return false;
      if (priceFilter === '400-800' && (property.price < 400 || property.price > 800)) return false;
      if (priceFilter === 'over800' && property.price <= 800) return false;
    }

    if (typeFilter !== 'all' && property.type !== typeFilter) return false;

    return true;
  });

  const clearFilters = () => {
    setLocationFilter('all');
    setSizeFilter('all');
    setPriceFilter('all');
    setTypeFilter('all');
  };

  const handleLogin = () => {
    if (publicCompanyId) {
      setIntendedCompanyId(publicCompanyId);
    }
    setIntendedCompanyName(company?.name ?? null);
    setCurrentView('login');
  };

  const handleApplyNow = (property: Property) => {
    if (!publicCompanyId) {
      notifyError('Missing company');
      return;
    }

    const isRentalType =
      property.type === 'Property Rentals' ||
      property.type === 'Commercial Rentals' ||
      property.type === 'Car Rentals';

    if (isRentalType) {
      setPublicProperty(property);
      setCurrentView('public-application');
      return;
    }

    // Allow public users to submit an application without an account.
    // We still store intended company so if they later login/signup, we can switch to this company.
    if (!currentUser || !authToken) {
      setIntendedCompanyId(publicCompanyId);
    }

    setSelectedProperty(property);
    setShowApplicationForm(true);
  };

  const handleFormClose = () => {
    setShowApplicationForm(false);
    setSelectedProperty(null);
  };

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'Residential':
        return <Home className="h-5 w-5 text-blue-600" />;
      case 'Commercial':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'Agricultural':
        return <Sprout className="h-5 w-5 text-blue-600" />;
      default:
        return <Building2 className="h-5 w-5 text-blue-600" />;
    }
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

  if (showApplicationForm && selectedProperty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <LandAcquisitionForm property={selectedProperty} company={company} onClose={handleFormClose} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold">{company?.name || 'Company Marketplace'}</h2>
              <p className="text-gray-600 mt-2">Browse and apply for available vacant land plots</p>
            </div>

            <div className="flex items-center gap-2">
              {!currentUser && !authToken && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleLogin}>
                  Login
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={() => setCurrentView('landing')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Refine your property search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locationOptions.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Size</label>
                  <Select value={sizeFilter} onValueChange={setSizeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sizes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      <SelectItem value="small">Small (&lt; 2,000 m²)</SelectItem>
                      <SelectItem value="medium">Medium (2,000-5,000 m²)</SelectItem>
                      <SelectItem value="large">Large (5,000+ m²)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="under400">Under D400K</SelectItem>
                      <SelectItem value="400-800">D400K - D800K</SelectItem>
                      <SelectItem value="over800">D800K+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Agricultural">Agricultural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {isLoading ? (
            <div className="text-sm text-gray-600">Loading properties...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gray-200">
                    <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
                    <div
                      className={`absolute top-2 right-2 ${getStatusColor(property.status)} text-white px-3 py-1 rounded-full text-sm font-medium`}
                    >
                      {property.status}
                    </div>
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      {getPropertyIcon(property.type)}
                    </div>
                    <CardDescription className="line-clamp-2">{property.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{property.location}</span>
                      {!!property.layoutImageUrl && (
                        <button
                          type="button"
                          className="ml-auto text-xs text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLayoutPreviewTitle('Layout Document');
                            setLayoutPreviewUrl(property.layoutImageUrl || null);
                            setLayoutPreviewOpen(true);
                          }}
                        >
                          View layout
                        </button>
                      )}
                    </div>

                    {(property.plotNumber || property.roomNumber) && (
                      <div className="text-sm text-gray-600">
                        {property.plotNumber && <span>Plot: {property.plotNumber}</span>}
                        {property.plotNumber && property.roomNumber && <span className="mx-2">|</span>}
                        {property.roomNumber && <span>Room: {property.roomNumber}</span>}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Square className="h-4 w-4 text-gray-500" />
                        <span>{property.size.toLocaleString()} m²</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>D{property.price}K</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(property.features || []).slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={property.status !== 'Available'}
                      onClick={() => handleApplyNow(property)}
                    >
                      Apply Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No properties found matching your filters.</p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>

      <LayoutDocumentPreviewDialog
        open={layoutPreviewOpen}
        onOpenChange={setLayoutPreviewOpen}
        title={layoutPreviewTitle}
        url={layoutPreviewUrl}
      />
    </div>
  );
}
