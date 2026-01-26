import { Building2, ChevronLeft, DollarSign, MapPin, Square } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { apiFetch } from '@/app/api';
import { useApp } from '@/app/context/AppContext';
import type { Property } from '@/app/types';
import { useEffect, useMemo, useState } from 'react';

export function InventoryTypeLanding() {
  const { publicInventoryType, setCurrentView, setPublicCompanyId, setPublicProperty } = useApp();
  const [inventories, setInventories] = useState<(Property & { companyName?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [companyFilter, setCompanyFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        const data = await apiFetch<(Property & { companyName?: string; company?: string | null })[]>(
          '/api/public/properties/',
        );
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
        setIsLoading(false);
      }
    })();
  }, []);

  const companyOptions = useMemo(() => {
    return Array.from(
      new Set(
        inventories
          .filter((inv) => !publicInventoryType || inv.type === publicInventoryType)
          .map((p) => (p.companyName ?? '').trim())
          .filter((v) => v.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [inventories, publicInventoryType]);

  const filteredInventories = useMemo(() => {
    if (!publicInventoryType) return [];
    return inventories
      .filter((inv) => {
        if (inv.type !== publicInventoryType) return false;

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

        return true;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [inventories, publicInventoryType, companyFilter, sizeFilter, priceFilter]);

  const handleOpenCompanyLanding = (inv: Property & { companyName?: string }) => {
    if (!inv.companyId) return;
    setPublicCompanyId(inv.companyId);
    setCurrentView('company-landing');
  };

  const handleApplyNow = (inv: Property & { companyName?: string }) => {
    if (!inv.companyId) return;

    const isRentalType =
      inv.type === 'Property Rentals' ||
      inv.type === 'Commercial Rentals' ||
      inv.type === 'Car Rentals';

    if (!isRentalType) {
      // Non-rental inventories keep existing Apply Now behavior.
      // (Currently this also routes to the application form.)
    }

    setPublicCompanyId(inv.companyId);
    setPublicProperty(inv as any);
    setCurrentView('public-application');
  };

  const clearFilters = () => {
    setCompanyFilter('all');
    setSizeFilter('all');
    setPriceFilter('all');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
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

            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => {
                setCurrentView('landing');
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{publicInventoryType ?? 'Inventories'}</h2>
              <p className="text-sm text-gray-600">Browse all inventories in this category</p>
            </div>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Refine inventory search</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-sm text-gray-600">
                    Showing {filteredInventories.length} {filteredInventories.length === 1 ? 'inventory' : 'inventories'}
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="text-sm text-gray-600">Loading inventories...</div>
            ) : publicInventoryType == null ? (
              <div className="text-sm text-gray-600">No inventory category selected.</div>
            ) : filteredInventories.length === 0 ? (
              <div className="text-sm text-gray-600">No inventories found in this category.</div>
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
                      <CardTitle className="text-lg">{inv.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{inv.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-gray-700 font-medium">{inv.companyName || 'Company'}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{inv.location}</span>
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
                        <Button
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyNow(inv);
                          }}
                        >
                          Apply Now
                        </Button>
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
  );
}
