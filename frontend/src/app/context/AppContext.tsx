import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { apiFetch } from '@/app/api';
import type { Application, Company, Property, User } from '@/app/types';

interface AppContextType {
  properties: Property[];
  applications: Application[];
  users: User[];
  companies: Company[];
  currentView: 'landing' | 'companies-landing' | 'company-landing' | 'public-application' | 'login' | 'signup' | 'company-selection' | 'client' | 'admin' | 'super-admin';
  currentCompany: Company | null;
  currentUser: User | null;
  authToken: string | null;
  intendedCompanyId: string | null;
  intendedCompanyName: string | null;
  publicCompanyId: string | null;
  publicProperty: Property | null;
  setCurrentView: (view: 'landing' | 'companies-landing' | 'company-landing' | 'public-application' | 'login' | 'signup' | 'company-selection' | 'client' | 'admin' | 'super-admin') => void;
  setCurrentCompany: (company: Company | null) => void;
  setCurrentUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;
  setIntendedCompanyId: (companyId: string | null) => void;
  setIntendedCompanyName: (companyName: string | null) => void;
  setPublicCompanyId: (companyId: string | null) => void;
  setPublicProperty: (property: Property | null) => void;
  refreshAll: (
    token: string,
    options?: { includeUsers?: boolean },
  ) => Promise<{ companies: Company[]; properties: Property[]; applications: Application[]; users?: User[] }>;
  hydrateFromApi: (data: {
    companies?: Company[];
    users?: User[];
    properties?: Property[];
    applications?: Application[];
  }) => void;
  logout: () => void;
  createProperty: (token: string, property: Partial<Property>) => Promise<Property>;
  updateProperty: (token: string, id: string, property: Partial<Property>) => Promise<Property>;
  deleteProperty: (token: string, id: string) => Promise<void>;
  createApplication: (token: string, application: Partial<Application>) => Promise<Application>;
  updateApplication: (token: string, id: string, application: Partial<Application>) => Promise<Application>;
  updateUser: (token: string, id: string, user: Partial<User>) => Promise<User>;
  createCompany: (token: string, company: Partial<Company>) => Promise<Company>;
  updateCompany: (token: string, id: string, company: Partial<Company>) => Promise<Company>;
  deleteCompany: (token: string, id: string) => Promise<void>;
  // Filtered data by current company
  getCompanyProperties: () => Property[];
  getCompanyApplications: () => Application[];
  getCompanyUsers: () => User[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentView, setCurrentView] = useState<'landing' | 'companies-landing' | 'company-landing' | 'public-application' | 'login' | 'signup' | 'company-selection' | 'client' | 'admin' | 'super-admin'>('landing');
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [intendedCompanyId, setIntendedCompanyId] = useState<string | null>(null);
  const [intendedCompanyName, setIntendedCompanyName] = useState<string | null>(null);
  const [publicCompanyId, setPublicCompanyId] = useState<string | null>(null);
  const [publicProperty, setPublicProperty] = useState<Property | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('raven_auth_token');
    } catch {
      return null;
    }
  });

  const setAuthTokenAndPersist = (token: string | null) => {
    setAuthToken(token);
    try {
      if (token) {
        localStorage.setItem('raven_auth_token', token);
      } else {
        localStorage.removeItem('raven_auth_token');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!authToken) return;
    if (currentUser) return;

    (async () => {
      try {
        const me = await apiFetch<User>('/api/auth/me/', { token: authToken });
        const data = await refreshAll(authToken, { includeUsers: me.role !== 'Client' });
        hydrateFromApi(data);

        setCurrentUser(me);

        const activeCompany = me.companyId ? (data.companies.find((c) => c.id === me.companyId) ?? null) : null;
        setCurrentCompany(activeCompany);

        if (me.role === 'SuperAdmin') {
          setCurrentView('super-admin');
        } else if (me.role === 'Admin') {
          setCurrentView('admin');
        } else if (me.role === 'Client') {
          const ids = (me.companyIds && me.companyIds.length > 0) ? me.companyIds : (me.companyId ? [me.companyId] : []);
          if (ids.length > 1) {
            setCurrentView('company-selection');
          } else {
            setCurrentView('client');
          }
        } else {
          setCurrentView('login');
        }
      } catch {
        setCurrentCompany(null);
        setCurrentUser(null);
        setAuthTokenAndPersist(null);
        setCurrentView('login');
      }
    })();
  }, [authToken, currentUser]);

  const hydrateFromApi = (data: {
    companies?: Company[];
    users?: User[];
    properties?: Property[];
    applications?: Application[];
  }) => {
    if (data.companies) setCompanies(data.companies);
    if (data.users) setUsers(data.users);
    if (data.properties) setProperties(data.properties);
    if (data.applications) setApplications(data.applications);
  };

  const refreshAll = async (token: string, options?: { includeUsers?: boolean }) => {
    const headers = { token };
    const includeUsers = options?.includeUsers !== false;

    const [companiesResp, propertiesResp, applicationsResp] = await Promise.all([
      apiFetch<Company[]>('/api/companies/', headers),
      apiFetch<Property[]>('/api/properties/', headers),
      apiFetch<Application[]>('/api/applications/', headers),
    ]);

    const normalizedProperties = (propertiesResp as any[]).map((p) => ({
      ...p,
      companyId: (p.companyId ?? p.company ?? null) as string,
      price: typeof p.price === 'string' ? Number(p.price) : p.price,
      size: typeof p.size === 'string' ? Number(p.size) : p.size,
    })) as Property[];

    const normalizedApplications = (applicationsResp as any[]).map((a) => ({
      ...a,
      companyId: (a.companyId ?? a.company ?? null) as string,
      propertyId: (a.propertyId ?? a.property ?? null) as string,
      userId: (a.userId ?? a.user ?? null) as string | null,
      offerAmount: typeof a.offerAmount === 'string' ? Number(a.offerAmount) : a.offerAmount,
    })) as Application[];

    let usersResp: User[] | undefined;
    if (includeUsers) {
      try {
        usersResp = await apiFetch<User[]>('/api/users/', headers);
      } catch {
        usersResp = undefined;
      }
    }

    return {
      companies: companiesResp,
      properties: normalizedProperties,
      applications: normalizedApplications,
      users: usersResp,
    };
  };

  const logout = () => {
    setAuthTokenAndPersist(null);
    setCurrentUser(null);
    setCurrentCompany(null);
    setCompanies([]);
    setUsers([]);
    setProperties([]);
    setApplications([]);
    setCurrentView('login');
  };

  const isFormData = (value: any): value is FormData => {
    return typeof FormData !== 'undefined' && value instanceof FormData;
  };

  const createProperty = async (token: string, property: Partial<Property>) => {
    const created = await apiFetch<Property>('/api/properties/', {
      token,
      method: 'POST',
      body: isFormData(property) ? (property as any) : JSON.stringify(property),
    });
    setProperties((prev) => [created, ...prev]);
    return created;
  };

  const updatePropertyApi = async (token: string, id: string, property: Partial<Property>) => {
    const updated = await apiFetch<Property>(`/api/properties/${id}/`, {
      token,
      method: 'PATCH',
      body: isFormData(property) ? (property as any) : JSON.stringify(property),
    });
    setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePropertyApi = async (token: string, id: string) => {
    await apiFetch<void>(`/api/properties/${id}/`, {
      token,
      method: 'DELETE',
    });
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const createApplication = async (token: string, application: Partial<Application>) => {
    const created = await apiFetch<Application>('/api/applications/', {
      token,
      method: 'POST',
      body: isFormData(application) ? (application as any) : JSON.stringify(application),
    });
    setApplications((prev) => [created, ...prev]);
    return created;
  };

  const updateApplicationApi = async (token: string, id: string, application: Partial<Application>) => {
    const updated = await apiFetch<Application>(`/api/applications/${id}/`, {
      token,
      method: 'PATCH',
      body: JSON.stringify(application),
    });
    setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const updateUserApi = async (token: string, id: string, user: Partial<User>) => {
    const updated = await apiFetch<User>(`/api/users/${id}/`, {
      token,
      method: 'PATCH',
      body: JSON.stringify(user),
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    return updated;
  };

  const createCompany = async (token: string, company: Partial<Company>) => {
    const created = await apiFetch<Company>('/api/companies/', {
      token,
      method: 'POST',
      body: JSON.stringify(company),
    });
    setCompanies((prev) => [created, ...prev]);
    return created;
  };

  const updateCompanyApi = async (token: string, id: string, company: Partial<Company>) => {
    const updated = await apiFetch<Company>(`/api/companies/${id}/`, {
      token,
      method: 'PATCH',
      body: JSON.stringify(company),
    });
    setCompanies((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCompanyApi = async (token: string, id: string) => {
    await apiFetch<void>(`/api/companies/${id}/`, {
      token,
      method: 'DELETE',
    });
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  };

  // Filter data by current company
  const getCompanyProperties = () => {
    if (!currentCompany) return properties;
    return properties.filter(p => p.companyId === currentCompany.id);
  };

  const getCompanyApplications = () => {
    if (!currentCompany) return applications;
    return applications.filter(a => a.companyId === currentCompany.id);
  };

  const getCompanyUsers = () => {
    if (!currentCompany) return users;
    return users.filter(u => u.companyId === currentCompany.id);
  };

  return (
    <AppContext.Provider
      value={{
        properties,
        applications,
        users,
        companies,
        currentView,
        currentCompany,
        currentUser,
        authToken,
        intendedCompanyId,
        intendedCompanyName,
        publicCompanyId,
        publicProperty,
        setCurrentView,
        setCurrentCompany,
        setCurrentUser,
        setAuthToken: setAuthTokenAndPersist,
        setIntendedCompanyId,
        setIntendedCompanyName,
        setPublicCompanyId,
        setPublicProperty,
        refreshAll,
        hydrateFromApi,
        logout,
        createProperty,
        updateProperty: updatePropertyApi,
        deleteProperty: deletePropertyApi,
        createApplication,
        updateApplication: updateApplicationApi,
        updateUser: updateUserApi,
        createCompany,
        updateCompany: updateCompanyApi,
        deleteCompany: deleteCompanyApi,
        getCompanyProperties,
        getCompanyApplications,
        getCompanyUsers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}