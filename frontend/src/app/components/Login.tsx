import { useState } from 'react';
import { Building2, LogIn } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { notifyError } from '@/app/notify';

import { apiFetch } from '@/app/api';
import type { User } from '@/app/types';

export function Login() {
  const {
    setCurrentUser,
    setCurrentCompany,
    setCurrentView,
    setAuthToken,
    hydrateFromApi,
    refreshAll,
    intendedCompanyId,
    setIntendedCompanyId,
    intendedCompanyName,
    setIntendedCompanyName,
  } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      notifyError('Please enter your email');
      return;
    }

    if (!password) {
      notifyError('Please enter your password');
      return;
    }

    try {
      const token = await apiFetch<{ access: string; refresh: string }>('/api/auth/token/', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      setAuthToken(token.access);

      const me = await apiFetch<User>('/api/auth/me/', { token: token.access });
      const data = await refreshAll(token.access, { includeUsers: me.role !== 'Client', role: me.role });

      hydrateFromApi(data);

      let effectiveUser: any = me as any;
      let effectiveData = data;

      if (effectiveUser.role === 'Admin' && intendedCompanyId) {
        try {
          const updatedUser = await apiFetch('/api/auth/active-company/', {
            token: token.access,
            method: 'POST',
            body: JSON.stringify({ companyId: intendedCompanyId }),
          });

          effectiveUser = updatedUser as any;
          effectiveData = await refreshAll(token.access, { includeUsers: (effectiveUser as any).role !== 'Client', role: (effectiveUser as any).role });
          hydrateFromApi(effectiveData);
        } catch {
          // If switching fails (e.g., user not a member), fall back to normal flow.
        } finally {
          setIntendedCompanyId(null);
          setIntendedCompanyName(null);
        }
      }

      setCurrentUser(effectiveUser);

      if (effectiveUser.role === 'SuperAdmin') {
        setCurrentCompany(null);
        setCurrentView('super-admin');
        return;
      }

      const company = (effectiveUser as any).companyId
        ? (effectiveData.companies.find((c: any) => c.id === (effectiveUser as any).companyId) ?? null)
        : null;
      setCurrentCompany(company);

      if (effectiveUser.role === 'Admin') {
        setCurrentView('admin');
        return;
      }

      setCurrentView('client');
    } catch (err: any) {
      notifyError(err?.message || 'Login failed');
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
              <h1 className="text-2xl font-bold">{intendedCompanyName || 'Suwokono'}</h1>
              <p className="text-sm text-gray-600">Sign in to continue</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Use your email to access your portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2" onClick={handleLogin}>
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>

              <Button variant="outline" className="w-full" onClick={() => setCurrentView('signup')}>
                Create client account
              </Button>

              <Button variant="outline" className="w-full" onClick={() => setCurrentView('landing')}>
                Back
              </Button>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
