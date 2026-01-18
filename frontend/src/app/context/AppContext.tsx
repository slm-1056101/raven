import React, { createContext, useContext, useState, ReactNode } from 'react';
import { properties as initialProperties, applications as initialApplications, users as initialUsers, companies as initialCompanies, Property, Application, User, Company } from '@/data/mockData';

interface AppContextType {
  properties: Property[];
  applications: Application[];
  users: User[];
  companies: Company[];
  currentView: 'landing' | 'login' | 'company-selection' | 'client' | 'admin' | 'super-admin';
  currentCompany: Company | null;
  currentUser: User | null;
  setCurrentView: (view: 'landing' | 'login' | 'company-selection' | 'client' | 'admin' | 'super-admin') => void;
  setCurrentCompany: (company: Company | null) => void;
  setCurrentUser: (user: User | null) => void;
  resetDemoData: () => Promise<void>;
  addProperty: (property: Property) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addApplication: (application: Application) => void;
  updateApplication: (id: string, application: Partial<Application>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  addCompany: (company: Company) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  // Filtered data by current company
  getCompanyProperties: () => Property[];
  getCompanyApplications: () => Application[];
  getCompanyUsers: () => User[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'company-selection' | 'client' | 'admin' | 'super-admin'>('landing');
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const resetDemoData = async () => {
    const data = await import('@/data/mockData');
    setProperties(data.properties);
    setApplications(data.applications);
    setUsers(data.users);
    setCompanies(data.companies);
    setCurrentCompany(null);
    setCurrentUser(null);
    setCurrentView('login');
  };

  const addProperty = (property: Property) => {
    setProperties(prev => [...prev, property]);
  };

  const updateProperty = (id: string, updatedProperty: Partial<Property>) => {
    setProperties(prev => 
      prev.map(prop => prop.id === id ? { ...prop, ...updatedProperty } : prop)
    );
  };

  const deleteProperty = (id: string) => {
    setProperties(prev => prev.filter(prop => prop.id !== id));
  };

  const addApplication = (application: Application) => {
    setApplications(prev => [...prev, application]);
  };

  const updateApplication = (id: string, updatedApplication: Partial<Application>) => {
    setApplications(prev =>
      prev.map(app => app.id === id ? { ...app, ...updatedApplication } : app)
    );
  };

  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setUsers(prev =>
      prev.map(user => user.id === id ? { ...user, ...updatedUser } : user)
    );
  };

  const addCompany = (company: Company) => {
    setCompanies(prev => [...prev, company]);
  };

  const updateCompany = (id: string, updatedCompany: Partial<Company>) => {
    setCompanies(prev =>
      prev.map(company => company.id === id ? { ...company, ...updatedCompany } : company)
    );
  };

  const deleteCompany = (id: string) => {
    setCompanies(prev => prev.filter(company => company.id !== id));
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
        setCurrentView,
        setCurrentCompany,
        setCurrentUser,
        resetDemoData,
        addProperty,
        updateProperty,
        deleteProperty,
        addApplication,
        updateApplication,
        updateUser,
        addCompany,
        updateCompany,
        deleteCompany,
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