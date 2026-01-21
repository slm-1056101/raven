import { useEffect, useMemo, useState } from 'react';
import { Building2, UserPlus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { notifyError, notifySuccess } from '@/app/notify';
import { useApp } from '@/app/context/AppContext';
import { apiFetch } from '@/app/api';
import type { Company, User } from '@/app/types';

export function Signup() {
  const { setCurrentView, setAuthToken, setCurrentUser, hydrateFromApi, refreshAll } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(() => Object.keys(selectedCompanyIds).filter((id) => selectedCompanyIds[id]), [selectedCompanyIds]);

  useEffect(() => {
    (async () => {
      try {
        const list = await apiFetch<Company[]>('/api/public/companies/');
        setCompanies(list);
      } catch (err: any) {
        notifyError(err?.message || 'Failed to load companies');
      }
    })();
  }, []);

  const toggleCompany = (id: string) => {
    setSelectedCompanyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) {
      notifyError('Please enter your name');
      return;
    }
    if (!normalizedEmail) {
      notifyError('Please enter your email');
      return;
    }
    if (!password) {
      notifyError('Please enter your password');
      return;
    }
    if (selectedIds.length === 0) {
      notifyError('Please select at least one company');
      return;
    }

    try {
      const resp = await apiFetch<{ access: string; refresh: string; user: any }>('/api/auth/signup/', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          password,
          companyIds: selectedIds,
        }),
      });

      setAuthToken(resp.access);

      const me = await apiFetch<User>('/api/auth/me/', { token: resp.access });
      const data = await refreshAll(resp.access, { includeUsers: me.role !== 'Client' });
      hydrateFromApi(data);

      setCurrentView('company-selection');
      notifySuccess('Account created');
    } catch (err: any) {
      notifyError(err?.message || 'Signup failed');
      setAuthToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Raven</h1>
              <p className="text-sm text-gray-600">Create a client account</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Sign up</CardTitle>
              <CardDescription>Select one or more companies and create your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Companies</div>
                <div className="space-y-2 max-h-56 overflow-auto rounded-lg border p-3">
                  {companies.map((c) => (
                    <label key={c.id} className="flex items-start gap-3 text-sm cursor-pointer">
                      <input type="checkbox" checked={!!selectedCompanyIds[c.id]} onChange={() => toggleCompany(c.id)} />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-gray-600 truncate">{c.contactEmail}</div>
                      </div>
                    </label>
                  ))}
                  {companies.length === 0 && <div className="text-sm text-gray-600">No companies available</div>}
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2" onClick={handleSignup}>
                <UserPlus className="h-4 w-4" />
                Create account
              </Button>

              <Button variant="outline" className="w-full" onClick={() => setCurrentView('login')}>
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
