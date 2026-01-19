import { useState } from 'react';
import { Building2, LogIn } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

export function Login() {
  const { companies, setCurrentUser, setCurrentCompany, setCurrentView, setAuthToken, hydrateFromApi, resetDemoData } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const DEMO_PASSWORD = 'raven123';

  const testAccounts = [
    { label: 'SuperAdmin', name: 'System Administrator', email: 'superadmin@raven.com' },
    { label: 'Admin (Delka)', name: 'Delka Admin', email: 'admin@delka.test' },
    { label: 'Client (Delka)', name: 'Delka Client', email: 'client@delka.test' },
  ];

  const apiFetch = async (path: string, init?: RequestInit) => {
    const res = await fetch(path, init);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Please enter your email');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    try {
      const token = await apiFetch('/api/auth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      setAuthToken(token.access);

      const me = await apiFetch('/api/auth/me/', {
        headers: { Authorization: `Bearer ${token.access}` },
      });

      const headers = { Authorization: `Bearer ${token.access}` };

      const [companiesResp, propertiesResp, applicationsResp] = await Promise.all([
        apiFetch('/api/companies/', { headers }),
        apiFetch('/api/properties/', { headers }),
        apiFetch('/api/applications/', { headers }),
      ]);

      const next: any = {
        companies: companiesResp,
        properties: propertiesResp,
        applications: applicationsResp,
      };

      if (me.role === 'Admin' || me.role === 'SuperAdmin') {
        try {
          next.users = await apiFetch('/api/users/', { headers });
        } catch {
          // ignore
        }
      }

      hydrateFromApi(next);
      setCurrentUser(me);

      if (me.role === 'SuperAdmin') {
        setCurrentCompany(null);
        setCurrentView('super-admin');
        return;
      }

      const company = me.companyId ? (companiesResp.find((c: any) => c.id === me.companyId) ?? null) : null;
      setCurrentCompany(company);

      if (me.role === 'Admin') {
        setCurrentView('admin');
        return;
      }

      setCurrentView('client');
    } catch (err: any) {
      toast.error(err?.message || 'Login failed');
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

              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await resetDemoData();
                  toast.success('Demo accounts reloaded');
                  setEmail('');
                  setPassword('');
                }}
              >
                Reload demo accounts
              </Button>

              <Button variant="outline" className="w-full" onClick={() => setCurrentView('landing')}>
                Back
              </Button>

              <div className="pt-4 border-t space-y-2">
                <div className="text-sm font-medium">Test Accounts</div>
                <div className="text-xs text-gray-600">Password for all: {DEMO_PASSWORD}</div>
                <div className="space-y-2">
                  {testAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      className="w-full text-left rounded-lg border px-3 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword(DEMO_PASSWORD);
                      }}
                    >
                      <div className="text-sm font-medium">{acc.label}</div>
                      <div className="text-xs text-gray-600">{acc.name}</div>
                      <div className="text-xs text-gray-600">{acc.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
