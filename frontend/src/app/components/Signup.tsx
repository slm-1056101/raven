import { useState } from 'react';
import { Building2, UserPlus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { notifyError, notifySuccess } from '@/app/notify';
import { useApp } from '@/app/context/AppContext';
import { apiFetch } from '@/app/api';
import type { User } from '@/app/types';

export function Signup() {
  const { setCurrentView, setAuthToken, setCurrentUser, hydrateFromApi, refreshAll } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    if (password !== confirmPassword) {
      notifyError('Passwords do not match');
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
        }),
      });

      setAuthToken(resp.access);

      const me = await apiFetch<User>('/api/auth/me/', { token: resp.access });
      const data = await refreshAll(resp.access, { includeUsers: me.role !== 'Client', role: me.role });
      hydrateFromApi(data);

      setCurrentView('client');
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
              <h1 className="text-2xl font-bold">Suwokono</h1>
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
              <CardDescription>Create your account</CardDescription>
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
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} />
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
