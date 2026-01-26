import { Building2, Users, CheckCircle, MapPin, Square, DollarSign, Home, Sprout, Menu, Car, Landmark, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { apiFetch } from '@/app/api';
import { useApp } from '@/app/context/AppContext';
import { LayoutDocumentPreviewDialog } from '@/app/components/LayoutDocumentPreviewDialog';
import type { Property } from '@/app/types';
import { useEffect, useMemo, useRef, useState } from 'react';

export function LandingPage() {
  const { setCurrentView, setIntendedCompanyId, authToken, currentUser, setCurrentUser, refreshAll, hydrateFromApi, setCurrentCompany, setPublicCompanyId, setPublicInventoryType } = useApp();
  const [inventories, setInventories] = useState<(Property & { companyName?: string })[]>([]);
  const [isLoadingInventories, setIsLoadingInventories] = useState(false);

  const inventoriesAnchorRef = useRef<HTMLDivElement | null>(null);

  const [layoutPreviewOpen, setLayoutPreviewOpen] = useState(false);
  const [layoutPreviewUrl, setLayoutPreviewUrl] = useState<string | null>(null);
  const [layoutPreviewTitle, setLayoutPreviewTitle] = useState('Layout Document');

  const [companyFilter, setCompanyFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const companyOptions = useMemo(() => {
    return Array.from(
      new Set(
        inventories
          .map((p) => (p.companyName ?? '').trim())
          .filter((v) => v.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [inventories]);

  const filteredInventories = useMemo(() => {
    return inventories.filter((inv) => {
      if (companyFilter !== 'all' && (inv.companyName ?? '') !== companyFilter) return false;

      if (sizeFilter !== 'all') {
        if (sizeFilter === 'small' && inv.size >= 2000) return false;
        if (sizeFilter === 'medium' && (inv.size < 2000 || inv.size > 5000)) return false;
        if (sizeFilter === 'large' && inv.size <= 5000) return false;
      }

      if (priceFilter !== 'all') {
        if (priceFilter === 'under400' && inv.price >= 400) return false;
        if (priceFilter === '400-800' && (inv.price < 400 || inv.price > 800)) return false;
        if (priceFilter === 'over800' && inv.price <= 800) return false;
      }

      if (typeFilter !== 'all' && inv.type !== typeFilter) return false;

      return true;
    });
  }, [inventories, companyFilter, sizeFilter, priceFilter, typeFilter]);

  const inventoryTypes = useMemo(() => {
    return [
      'Property Rentals',
      'Commercial Rentals',
      'Agricultural',
      'Land For Sale',
      'Car Rentals',
      'Other',
    ] as const;
  }, []);

  const clearFilters = () => {
    setCompanyFilter('all');
    setSizeFilter('all');
    setPriceFilter('all');
    setTypeFilter('all');
  };

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'Property Rentals':
      case 'Land For Sale':
        return <Home className="h-5 w-5 text-blue-600" />;
      case 'Commercial Rentals':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'Agricultural':
        return <Sprout className="h-5 w-5 text-blue-600" />;
      case 'Car Rentals':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'Other':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      default:
        return <Building2 className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeTabIcon = (type: Property['type']) => {
    switch (type) {
      case 'Property Rentals':
        return <Home className="h-4 w-4" />;
      case 'Commercial Rentals':
        return <Building2 className="h-4 w-4" />;
      case 'Agricultural':
        return <Sprout className="h-4 w-4" />;
      case 'Land For Sale':
        return <Landmark className="h-4 w-4" />;
      case 'Car Rentals':
        return <Car className="h-4 w-4" />;
      case 'Other':
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleOpenCompanyLanding = (inv: Property & { companyName?: string }) => {
    if (!inv.companyId) return;
    setPublicCompanyId(inv.companyId);
    setCurrentView('company-landing');
  };

  const handleSelectTypeFromHeader = (type: Property['type']) => {
    setPublicInventoryType(type);
    setCurrentView('inventory-type');
  };

  useEffect(() => {
    setIsLoadingInventories(true);
    (async () => {
      try {
        const data = await apiFetch<(Property & { companyName?: string; company?: string | null })[]>('/api/public/properties/');
        const normalized = (Array.isArray(data) ? data : []).map((p: any) => ({
          ...p,
          companyId: (p.companyId ?? p.company ?? null) as string,
          price: typeof p.price === 'string' ? Number(p.price) : p.price,
          size: typeof p.size === 'string' ? Number(p.size) : p.size,
        }));
        setInventories(normalized as any);
      } catch {
        setInventories([]);
      } finally {
        setIsLoadingInventories(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Sukonowo</h1>
                <p className="text-sm text-gray-600">Multi-Tenant Property Management Platform</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center overflow-x-auto">
              {inventoryTypes.map((t) => {
                const hasItems = inventories.some((inv) => inv.type === t);
                if (!hasItems) return null;

                return (
                  <Button
                    key={t}
                    variant="ghost"
                    size="sm"
                    className="whitespace-nowrap text-base gap-2"
                    onClick={() => handleSelectTypeFromHeader(t)}
                  >
                    {getTypeTabIcon(t)}
                    {t}
                  </Button>
                );
              })}
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Access portal">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white text-gray-900 border border-gray-200 shadow-lg"
              >
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    setCurrentView('login');
                  }}
                >
                  Login
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    setCurrentView('signup');
                  }}
                >
                  Create client account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-5xl font-bold text-gray-900">
            Welcome to Sukonowo
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive multi-tenant platform for managing vacant land acquisitions, applications, 
            and property inventory across multiple real estate companies.
          </p>

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

          <div className="mt-16 text-left">
            <div ref={inventoriesAnchorRef} />
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Available Inventories</h3>
                <p className="text-sm text-gray-600">Browse listings from all companies</p>
              </div>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>Refine inventory search</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company</label>
                      <Select value={companyFilter} onValueChange={setCompanyFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Companies</SelectItem>
                          {companyOptions.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Plot Size</label>
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
                      <label className="text-sm font-medium">Amount</label>
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
                      <label className="text-sm font-medium">Type</label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
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
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-gray-600">
                Showing {filteredInventories.length} {filteredInventories.length === 1 ? 'inventory' : 'inventories'}
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>

            <div className="mt-6">
              {isLoadingInventories ? (
                <div className="text-sm text-gray-600">Loading inventories...</div>
              ) : inventories.length === 0 ? (
                <div className="text-sm text-gray-600">No inventories available yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInventories.map((inv) => (
                    <Card
                      key={inv.id}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenCompanyLanding(inv)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenCompanyLanding(inv);
                        }
                      }}
                      aria-label={`View ${inv.companyName || 'company'} inventory`}
                    >
                      <div className="relative h-48 bg-gray-200">
                        <img
                          src={inv.imageUrl || ''}
                          alt={inv.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '';
                          }}
                        />
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{inv.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getPropertyIcon(inv.type)}
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {inv.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm text-gray-700 font-medium">{inv.companyName || 'Company'}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{inv.location}</span>
                          {!!inv.layoutImageUrl && (
                            <button
                              type="button"
                              className="ml-auto text-xs text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLayoutPreviewTitle('Layout Document');
                                setLayoutPreviewUrl(inv.layoutImageUrl || null);
                                setLayoutPreviewOpen(true);
                              }}
                            >
                              View layout
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Square className="h-4 w-4 text-gray-500" />
                            <span>{inv.size.toLocaleString()} m²</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span>D{inv.price}K</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="text-sm text-blue-600 text-center font-medium">View company</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
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