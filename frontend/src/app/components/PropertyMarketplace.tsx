import { useState } from 'react';
import { MapPin, Square, DollarSign, Home, Building2, Sprout } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/app/context/AppContext';
import { LandAcquisitionForm } from '@/app/components/LandAcquisitionForm';
import type { Property } from '@/app/types';

export function PropertyMarketplace() {
  const { getCompanyProperties, currentCompany } = useApp();
  const properties = getCompanyProperties();
  const [locationFilter, setLocationFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const handleApplyNow = (property: Property) => {
    setSelectedProperty(property);
    setShowApplicationForm(true);
  };

  const handleFormClose = () => {
    setShowApplicationForm(false);
    setSelectedProperty(null);
  };

  const filteredProperties = properties.filter((property) => {
    // Location filter
    if (locationFilter !== 'all') {
      const state = property.location.split(', ')[1];
      if (state !== locationFilter) return false;
    }

    // Size filter
    if (sizeFilter !== 'all') {
      if (sizeFilter === 'small' && property.size >= 2000) return false;
      if (sizeFilter === 'medium' && (property.size < 2000 || property.size > 5000)) return false;
      if (sizeFilter === 'large' && property.size <= 5000) return false;
    }

    // Price filter
    if (priceFilter !== 'all') {
      if (priceFilter === 'under400' && property.price >= 400) return false;
      if (priceFilter === '400-800' && (property.price < 400 || property.price > 800)) return false;
      if (priceFilter === 'over800' && property.price <= 800) return false;
    }

    // Type filter
    if (typeFilter !== 'all' && property.type !== typeFilter) return false;

    return true;
  });

  const clearFilters = () => {
    setLocationFilter('all');
    setSizeFilter('all');
    setPriceFilter('all');
    setTypeFilter('all');
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
    return <LandAcquisitionForm property={selectedProperty} onClose={handleFormClose} />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold">Vacant Land Marketplace</h2>
        <p className="text-gray-600 mt-2">Browse and apply for available vacant land plots</p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine your property search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="FL">Florida</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="WA">Washington</SelectItem>
                  <SelectItem value="CO">Colorado</SelectItem>
                  <SelectItem value="OR">Oregon</SelectItem>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="SC">South Carolina</SelectItem>
                  <SelectItem value="AZ">Arizona</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Size Filter */}
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

            {/* Price Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range</label>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under400">Under $400K</SelectItem>
                  <SelectItem value="400-800">$400K - $800K</SelectItem>
                  <SelectItem value="over800">$800K+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
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

      {/* Results Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
        </p>
        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Property Image */}
            <div className="relative h-48 bg-gray-200">
              <img 
                src={property.imageUrl} 
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-2 right-2 ${getStatusColor(property.status)} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                {property.status}
              </div>
            </div>

            {/* Card Header */}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{property.title}</CardTitle>
                {getPropertyIcon(property.type)}
              </div>
              <CardDescription className="line-clamp-2">
                {property.description}
              </CardDescription>
            </CardHeader>

            {/* Card Content */}
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{property.location}</span>
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
                  <span>${property.price}K</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {property.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>

            {/* Card Footer */}
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

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No properties found matching your filters.</p>
          <Button variant="link" onClick={clearFilters} className="mt-2">
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}